import express from 'express';
import path from 'path';
import cors from 'cors'; 
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getSessionID, mapRowsAndSubrowsByPlateNumber, getUnitGroups, getUnits } from './wialonService.mjs';
import { getRMASessionID, mapRowsAndSubrowsByPlateNumberOverSpeed, getUnitGroupsOverSpeed } from './RMAServices.mjs';
import { getRMASessionIdlingID, mapRowsAndSubrowsByPlateNumberIdling, getUnitGroupsIdling } from './RMAServicesIdling.mjs';
import userRoutes from './routes/users.mjs';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Use user routes
app.use('/api', userRoutes);

// Start RMA OverSpeed
app.get('/api/get-unit-groups_idling', async (req, res) => {
    try {
        const eid = await getRMASessionIdlingID();
        const unitGroups = await getUnitGroupsIdling(eid);
        res.json(unitGroups);
    } catch (error) {
        console.error('Error in /get-unit-groups_overspeed:', error.message);
        res.status(500).json({ error: 'Failed to fetch unit groups', details: error.message });
    }
});

app.get('/api/map-rows-and-subrows_idling', async (req, res) => {
    try {
        const { unitGroup, startDate, endDate } = req.query;
        const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        const eid = await getRMASessionIdlingID();
        const finalResult = await mapRowsAndSubrowsByPlateNumberIdling(eid, fromTimestamp, toTimestamp, unitGroup);
        res.json(finalResult);
    } catch (error) {
        console.error('Error in /map-rows-and-subrows_overspeed:', error.message);
        res.status(500).json({ error: 'Failed to map rows and subrows by plate number', details: error.message });
    }
});


// Start RMA OverSpeed
app.get('/api/get-unit-groups_overspeed', async (req, res) => {
    try {
        const eid = await getRMASessionID();
        const unitGroups = await getUnitGroupsOverSpeed(eid);
        res.json(unitGroups);
    } catch (error) {
        console.error('Error in /get-unit-groups_overspeed:', error.message);
        res.status(500).json({ error: 'Failed to fetch unit groups', details: error.message });
    }
});

app.get('/api/map-rows-and-subrows_overspeed', async (req, res) => {
    try {
        const { unitGroup, startDate, endDate } = req.query;
        const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        const eid = await getRMASessionID();
        const finalResult = await mapRowsAndSubrowsByPlateNumberOverSpeed(eid, fromTimestamp, toTimestamp, unitGroup);
        res.json(finalResult);
    } catch (error) {
        console.error('Error in /map-rows-and-subrows_overspeed:', error.message);
        res.status(500).json({ error: 'Failed to map rows and subrows by plate number', details: error.message });
    }
});
// End RMA OverSpeed

app.get('/api/get-unit-groups', async (req, res) => {
    try {
        const eid = await getSessionID();
        const unitGroups = await getUnitGroups(eid);
        res.json(unitGroups);
    } catch (error) {
        console.error('Error in /get-unit-groups:', error.message);
        res.status(500).json({ error: 'Failed to fetch unit groups', details: error.message });
    }
});

app.get('/api/get-units', async (req, res) => {
    try {
        const eid = await getSessionID();
        const Units = await getUnits(eid);
        res.json(Units);
    } catch (error) {
        console.error('Error in /Units:', error.message);
        res.status(500).json({ error: 'Failed to Units', details: error.message });
    }
});

app.get('/api/map-rows-and-subrows', async (req, res) => {
    try {
        const { units,unitGroup, startDate, endDate } = req.query;
        const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
        const eid = await getSessionID();
        const finalResult = await mapRowsAndSubrowsByPlateNumber(eid, fromTimestamp, toTimestamp, unitGroup,units);
        res.json(finalResult);
    } catch (error) {
        console.error('Error in /map-rows-and-subrows:', error.message);
        res.status(500).json({ error: 'Failed to map rows and subrows by plate number', details: error.message });
    }
});

// Root route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
