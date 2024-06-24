import pool from "../../db";
import { getUserId } from "../../utils/getUserId";
import { getUserPermissions } from "../../utils/getUserPermissions";
import logger from "../../utils/logger";
import { objectToQuery, objectToQueryUpdate } from "../../utils/objectToQuery";

export const getSchedules = (req, res) => {
	const { searchQuery } = req.query;
	const query = {
		text: `SELECT scheduleTracker.id, school.name as school, person.full_name, initiative.name as initiative, scheduleTracker.duration, 
		scheduleTracker.numofnewstudents, scheduleTracker.numofexistingstudents,	
		scheduleTracker.numofnewteachers, scheduleTracker.numofexistingteachers, 
		scheduleTracker.grades, scheduleTracker.languagestaught, scheduleTracker.totalnumtablets, 
		scheduleTracker.supportcategory, scheduleTracker.supporttype, scheduleTracker.deliveredbyid, 
		person.auth0_id as delivered_by_auth0_id, createdBy.auth0_id as created_by_auth0_id,
		scheduleTracker.schoolId, scheduleTracker.programmeInitiativeId 
		FROM scheduleTracker 
		INNER JOIN school on school.id = scheduleTracker.schoolId 
		INNER JOIN initiative on initiative.id = scheduleTracker.programmeInitiativeId 
		INNER JOIN person on scheduleTracker.deliveredById = person.id 
		INNER JOIN person as createdBy on scheduleTracker.created_byid = createdBy.id `,
	};

	if (searchQuery) {
		query.text +=
			" WHERE LOWER(school.name) LIKE $1 or LOWER(initiative.name) LIKE $1";
		query.text += " ORDER BY scheduleTracker.created_at DESC, school.country";
		query.values = ["%" + searchQuery.toLowerCase() + "%"];
	}

	pool.query(query, (err, results) => {
		if (err) {
			res.status(400).json({ message: err.message });
			return;
		}
		res.json(results.rows);
	});
};

export const getFormData = async (req, res) => {
	try {
		const schools = await pool.query("SELECT DISTINCT(name), id FROM school");
		const initiatives = await pool.query(
			"SELECT DISTINCT(name), id FROM initiative"
		);
		const persons = await pool.query(
			"SELECT id, full_name, auth0_id FROM person"
		);
		const languages = await pool.query(
			"SELECT DISTINCT(UNNEST(STRING_TO_ARRAY(languagestaught,','))) FROM scheduleTracker"
		);
		res.json({
			schools: schools.rows,
			initiatives: initiatives.rows,
			persons: persons.rows,
			languages: languages.rows.map((el) => ({
				value: el.unnest,
				label: el.unnest,
			})),
		});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

export const createScheduleTracker = async (req, res) => {
	try {
		const userId = await getUserId(req);
		const scheduleTracker = { ...req.body, created_byid: userId };
		const insertQuery = objectToQuery(scheduleTracker);

		const results = await pool.query(
			`INSERT INTO scheduleTracker ${insertQuery}`
		);

		res.send(results.rows);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const checkUserPermissions = async (req, res) => {
	const { id } = req.params;
	const userId = await getUserId(req);

	const userPermissions = getUserPermissions(req);

	if (
		!(
			userPermissions.includes("admin") ||
			userPermissions.includes("super-admin")
		)
	) {
		const prevRecord = await pool.query(
			"SELECT count(*) FROM scheduleTracker WHERE id=$1 AND(deliveredbyid=$2 OR createdbyid=$2)",
			[id, userId]
		);
		if (prevRecord.rows[0].count === 0) {
			res
				.status(403)
				.json({ message: "You are not authorized to edit this record" });
			return;
		}
	}
};

export const updateSchedule = async (req, res) => {
	try {
		await checkUserPermissions(req, res);
		const schedule = req.body;
		const { id } = req.params;

		const insertQuery = objectToQueryUpdate(schedule);

		pool.query(
			`UPDATE scheduletracker SET ${insertQuery} WHERE id=$1 RETURNING *`,
			[id],
			(err, results) => {
				if (err) {
					res.status(400).json({ message: err.message });
					return;
				}
				res.send(results.rows);
			}
		);
	} catch (error) {
		logger.error(error);
		res.status(400).json({ message: error.message });
	}
};

export const deleteSchedule = async (req, res) => {
	try {
		await checkUserPermissions(req, res);
		console.log("in deleteSchedule");
		const { id } = req.params;

		pool.query(
			"DELETE FROM scheduletracker WHERE id=$1 RETURNING *",
			[id],
			(err, results) => {
				if (err) {
					res.status(400).json({ message: err.message });
					return;
				}
				res.send(results.rows);
			}
		);
	} catch (error) {
		logger.error(error);
		res.status(400).json({ message: error.message });
	}
};
