import fetch from 'node-fetch';
import moment from 'moment-timezone';

const wialonToken = 'e871c38952ca836db54c74d50dc4ace705F692BA0FDD6B14C3809A4A10FDE7CAC8DBA5DA';
const apiUrl = 'https://hst-api.wialon.com/wialon/ajax.html';

async function setLocaleAndFormat(eid) {
    const localeParams = {
        tzOffset: 25200, // Adjust this value as needed
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

export async function getSessionID() {
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

export async function executeReport(eid, from, to, unitGroup,units) {
    const reportParams = {
        reportResourceId: 600616829,
        reportTemplateId: 1,
        reportTemplate: null,
        reportObjectId: unitGroup || units,
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
        indexTo: 200,
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

export async function mapRowsAndSubrowsByPlateNumber(eid, fromTimestamp, toTimestamp, unitGroup,units) {
    await executeReport(eid, fromTimestamp, toTimestamp, unitGroup,units);

    const rowsTable0 = await getRows(eid, 0);
    const rowsTable1 = await getRows(eid, 1);
    const rowsTable2 = await getRows(eid, 2);
    const rowsTable3 = await getRows(eid, 3);
    const rowsTable4 = await getRows(eid, 4);
    const rowsTable5 = await getRows(eid, 5);
    const rowsTable6 = await getRows(eid, 6);
    const rowsTable7 = await getRows(eid, 7);
    const rowsTable8 = await getRows(eid, 8);
    const rowsTable9 = await getRows(eid, 9);
    const rowsTable10 = await getRows(eid, 10);

    const mapTable1 = rowsTable1.reduce((map, row) => {
        map[row.c[0]] = { idlingtime: row.c[1] || null };
        return map;
    }, {});

    const mapTable2 = rowsTable2.reduce((map, row) => {
        map[row.c[0]] = { idlingtimecount: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable3 = rowsTable3.reduce((map, row) => {
        map[row.c[0]] = { overspeed: row.c[1] || 0 };
        return map;
    }, {});
    const mapTable4 = rowsTable4.reduce((map, row) => {
        map[row.c[0]] = { braking: row.c[1] || 0 };
        return map;
    }, {});
    const mapTable5 = rowsTable5.reduce((map, row) => {
        map[row.c[0]] = { acceleration: row.c[1] || 0 };
        return map;
    }, {});
    const mapTable6 = rowsTable6.reduce((map, row) => {
        map[row.c[0]] = { cornering: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable7 = rowsTable7.reduce((map, row) => {
        map[row.c[0]] = { engineover12: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable8 = rowsTable8.reduce((map, row) => {
        map[row.c[0]] = { engineover2: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable9 = rowsTable9.reduce((map, row) => {
        map[row.c[0]] = { parking12: row.c[1] || 0 };
        return map;
    }, {});

    const mapTable10 = rowsTable10.reduce((map, row) => {
        map[row.c[0]] = { parking24: row.c[1] || 0 };
        return map;
    }, {});
    const finalResult = [];
    for (let i = 0; i < rowsTable0.length; i++) {
        const row = rowsTable0[i];
        const plateNumber = row.c[0];
        const sm_Code = row.c[1];
        const driverName = row.c[2];
        const duration = row.c[5];
        const totalMileage = row.c[6];
        const vehiclesType = row.c[7];
        const totalStartStop = row.c[8];
        const beginning = row.c[3]?.t || "00.00.0000 00:00:00";
        const end = row.c[4]?.t || "00.00.0000 00:00:00";
        finalResult.push({
            plateNumber,
            sm_code: sm_Code,
            driverName,
            beginning,
            end,
            duration,
            totalMileage,
            vehiclesType,
            totalStartStop,
            ...mapTable1[plateNumber],
            ...mapTable2[plateNumber],
            ...mapTable3[plateNumber],
            ...mapTable4[plateNumber],
            ...mapTable5[plateNumber],
            ...mapTable6[plateNumber],
            ...mapTable7[plateNumber],
            ...mapTable8[plateNumber],
            ...mapTable9[plateNumber],
            ...mapTable10[plateNumber],
        });
    }

    return finalResult;
}


export async function getUnitGroups(eid) {
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
export async function getUnits(eid) {

    const url = `${apiUrl}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify({
        spec: {
            itemsType: 'avl_unit',
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
