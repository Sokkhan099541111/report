import fetch from 'node-fetch';

const wialonToken = 'e871c38952ca836db54c74d50dc4ace7A640E927AC5F6CCB659283A361DD58442FB3E44E';
const apiUrl = 'https://hst-api.wialon.com/wialon/ajax.html';

export async function getRMASessionID() {
    const loginUrl = `${apiUrl}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token: wialonToken }))}`;
    try {
        const response = await fetch(loginUrl);
        const data = await response.json();
        if (data.error) throw new Error(`Error logging in: ${data.error}`);
        return data.eid;
    } catch (error) {
        console.error('Error fetching session ID:', error.message);
        throw error;
    }
}

export async function executeReport(eid, from, to, unitGroup) {
    const reportParams = {
        reportResourceId: 600260939,
        reportTemplateId: 15,
        reportTemplate: null,
        reportObjectId: unitGroup,
        reportObjectSecId: 0,
        interval: {
            flags: 16777216,
            from,
            to,
        },
    };

    const requestUrl = `${apiUrl}?svc=report/exec_report&params=${encodeURIComponent(JSON.stringify(reportParams))}&sid=${eid}`;
    try {
        const response = await fetch(requestUrl);
        const data = await response.json();
        if (data.error) throw new Error(`Error executing report: ${data.error}`);
        return data;
    } catch (error) {
        console.error('Error executing report:', error.message);
        throw error;
    }
}

export async function getRows(eid, tableIndex) {
    const requestUrl = `${apiUrl}?svc=report/get_result_rows&params=${encodeURIComponent(JSON.stringify({
        tableIndex,
        indexFrom: 0,
        indexTo: 100,
        level: 4,
    }))}&sid=${eid}`;

    try {
        const response = await fetch(requestUrl);
        const data = await response.json();
        if (data.error) throw new Error(`Error fetching rows for tableIndex ${tableIndex}: ${data.error}`);
        return data;
    } catch (error) {
        console.error(`Error fetching rows for tableIndex ${tableIndex}:`, error.message);
        throw error;
    }
}

export async function getSubrowsForRow(eid, tableIndex, rowIndex) {
    const requestUrl = `${apiUrl}?svc=report/get_result_subrows&params=${encodeURIComponent(JSON.stringify({
        tableIndex,
        rowIndex,
    }))}&sid=${eid}`;

    try {
        const response = await fetch(requestUrl);
        const data = await response.json();
        if (data.error) throw new Error(`Error fetching subrows for rowIndex ${rowIndex}: ${data.error}`);
        return data;
    } catch (error) {
        console.error('Error fetching subrows:', error.message);
        throw error;
    }
}

export async function mapRowsAndSubrowsByPlateNumberOverSpeed(eid, fromTimestamp, toTimestamp, unitGroup) {
    await executeReport(eid, fromTimestamp, toTimestamp, unitGroup);

    const rowsTable0 = await getRows(eid, 0);
    const rowsTable1 = await getRows(eid, 1);
    const rowsTable2 = await getRows(eid, 2);
    const rowsTable3 = await getRows(eid, 3);
    const rowsTable4 = await getRows(eid, 4);

    const mapTable1 = rowsTable1.reduce((map, row) => {
        map[row.c[0]] = { fuel: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable2 = rowsTable2.reduce((map, row) => {
        map[row.c[0]] = { overpseed80: row.c[1] || null };
        return map;
    }, {});
    const mapTable3 = rowsTable3.reduce((map, row) => {
        map[row.c[0]] = { overpseed100: row.c[1] || null };
        return map;
    }, {});
    const mapTable4 = rowsTable4.reduce((map, row) => {
        map[row.c[0]] = { overpseed100: row.c[1] || null };
        return map;
    }, {});

    const finalResult = [];

    for (let i = 0; i < rowsTable0.length; i++) {
        const row = rowsTable0[i];
        const plateNumber = row.c[0];
        const division = row.c[1];
        const model = row.c[2];
        const department = row.c[3];
        const term = row.c[4];
        const user = row.c[5];
        finalResult.push({
            plateNumber,
            division,
            model,
            department,
            term,
            user,
            ...mapTable1[plateNumber],
            ...mapTable2[plateNumber],
            ...mapTable3[plateNumber],
            ...mapTable4[plateNumber]
        });
    }

    return finalResult;
}

export async function getUnitGroupsOverSpeed(eid) {
    const url = `${apiUrl}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify({
        spec: {
            itemsType: 'avl_unit_group',
            propName: 'sys_name',
            propValueMask: '*',
            sortType: 'sys_name',
        },
        force: 1,
        flags: 1,
        from: 0,
        to: 0,
    }))}&sid=${eid}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(`Error fetching unit groups: ${data.error}`);
        return data.items;
    } catch (error) {
        console.error('Error fetching unit groups:', error.message);
        throw error;
    }
}
