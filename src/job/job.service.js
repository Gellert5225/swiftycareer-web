const db = require('../server/db');
const Job = db.database.collection('Job');

exports.getAllJobs = async () => {
    const jobs = await Job.aggregate([
        {
            $lookup: {
                from : "Company",
                localField: "company",
                foreignField: "_id",
                as : "company"
            }
        },
        {
            $unwind: "$company"
        },
        {
            $sort: { "created_at": -1 }
        }
    ]).toArray();

    return jobs;
}
