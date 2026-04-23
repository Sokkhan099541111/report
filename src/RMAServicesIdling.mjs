import fetch from 'node-fetch';

const wialonToken = '09c7cde89cc265bd8e762254b01d8e70AE01B9905FF2853A2A429321007D945DFEBD804E';
const apiUrl = 'https://hst-api.wialon.com/wialon/ajax.html';

async function setLocaleAndFormat(eid) {
    const localeParams = {
        tzOffset: 134242928, // Adjust this value as needed
        language: 'en',
        flags: 256,
        formatDate: '%E.%m.%Y %H:%M:%S'
    };

    const requestUrl = `${apiUrl}?svc=render/set_locale&params=${encodeURIComponent(JSON.stringify(localeParams))}&sid=${eid}`;

    try {
        const response = await fetch(requestUrl);
        const data = await response.json();;
        if (data.error) throw new Error(`Error setting locale and format: ${data.error}`);
        console.log('Locale and format set successfully');
    } catch (error) {
        console.error('Error setting locale and format:', error.message);
        throw error;
    }
}


export async function getRMASessionIdlingID() {
    const loginUrl = `${apiUrl}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token: wialonToken }))}`;
    try {
        const response = await fetch(loginUrl);
        const data = await response.json();
        if (data.error) throw new Error(`Error logging in: ${data.error}`);
        const eid = data.eid;
        // Set locale and format after obtaining session ID
        await setLocaleAndFormat(eid);
        return eid;
    } catch (error) {
        console.error('Error fetching session ID:', error.message);
        throw error;
    }
}

export async function executeReport(eid, from, to, unitGroup) {
    const reportParams = {
        reportResourceId: 600260939,
        reportTemplateId: 17,
        reportTemplate: null,
        reportObjectId: unitGroup,
        reportObjectSecId: 0,
        interval: {
            flags: 16777216,
            from:from,
            to:to,
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
        console.log(data);
        if (data.error) throw new Error(`Error fetching subrows for rowIndex ${rowIndex}: ${data.error}`);
        return data;
    } catch (error) {
        console.error('Error fetching subrows:', error.message);
        throw error;
    }
}

export async function mapRowsAndSubrowsByPlateNumberIdling(eid, fromTimestamp, toTimestamp, unitGroup) {
    await executeReport(eid, fromTimestamp, toTimestamp, unitGroup);

    const rowsTable0 = await getRows(eid, 0);
    const rowsTable1 = await getRows(eid, 1);
    const rowsTable2 = await getRows(eid, 2);
    const rowsTable3 = await getRows(eid, 3);
    const rowsTable4 = await getRows(eid, 4);
    const rowsTable5 = await getRows(eid, 5);
    const rowsTable6 = await getRows(eid, 6);
    const rowsTable7 = await getRows(eid, 7);

    const mapTable1 = rowsTable1.reduce((map, row) => {
        map[row.c[0]] = { fuel: row.c[1] };
        return map;
    }, {});

    const mapTable2 = rowsTable2.reduce((map, row) => {
        map[row.c[0]] = { idling59: row.c[1] || null, idling59min: row.c[2] || null };
        // map[row.c[0]] = { idling59min: row.c[2] || null };
        return map;
    }, {});
    const mapTable3 = rowsTable3.reduce((map, row) => {
        map[row.c[0]] = { idling1015: row.c[1] || null , idling1015min: row.c[2] || null};
        return map;
    }, {});
    const mapTable4 = rowsTable4.reduce((map, row) => {
        map[row.c[0]] = { idling15: row.c[1] || null, idling15min: row.c[2] || null };
        return map;
    }, {});
    const mapTable5 = rowsTable5.reduce((map, row) => {
            map[row.c[0]] = { nighttimes: row.c[1] || null, nighttimesmin: row.c[2] || null };
        return map;
    }, {});
   

    const mapTable6 = rowsTable6.reduce((map, row) => {
        map[row.c[0]] = { saturdaytime: row.c[1],saturdaytimemin: row.c[2] };
        return map;
    }, {});

    const mapTable7 = rowsTable7.reduce((map, row) => {
        map[row.c[0]] = { sundaytime: row.c[1] ||  null,sundaytimemin: row.c[2] ||  null };
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
            ...mapTable4[plateNumber],
            ...mapTable5[plateNumber],
            ...mapTable6[plateNumber],
            ...mapTable7[plateNumber],
        });
    }

    return finalResult;
}

export async function getUnitGroupsIdling(eid) {
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
