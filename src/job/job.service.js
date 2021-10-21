const db = require('../server/db');
const Job = db.database.collection('Job');

exports.getJobsWithQuery = async (query) => {
    const pipeline = createMatchPipelineForGetJobs(query);
    const jobs = await Job.aggregate([
        {
            $lookup: {
                from : "User",
                localField: "recruiter",
                foreignField: "_id",
                as : "recruiter"
            }
        },
        {
            $match: pipeline.$match
        },
        {
            $unwind: "$recruiter"
        },
        {
            $project: { "recruiter.hashed_password": 0 }
        },
        {
            $sort: { "created_at": -1 }
        }
    ]).toArray();

    return jobs;
}

exports.postJob = async (body) => {
    const job = {
        job_title: body.job_title,
        job_location: body.job_location,
        job_type: body.job_type,
        job_description: body.job_description,
        job_description_short: body.job_description_short,
        department: body.department,
        experience_level: body.experience_level,
        pay_rate: body.pay_rate,
        is_remote: body.is_remote,
        recruiter: db.mongodb.ObjectID(body.recruiter),
        created_at: Date.now()
    }

    let insert_job_response = (await Job.insertOne(job)).ops[0];

    return insert_job_response;
}

function createMatchPipelineForGetJobs(query) {
    const pipeline = {};
    pipeline.$match = {};

    if (query.jobtype)
        pipeline.$match["job_type"] = query.jobtype;
    if (query.exp)
        pipeline.$match["experience_level"] = query.exp;
    if (query.payrate)
        pipeline.$match["pay_rate"] = { $gt: parseInt(query.payrate) };
    if (query.department)
        pipeline.$match["department"] = query.department;
    if (query.remote)
        pipeline.$match["is_remote"] = (query.remote === "true" ? true : false);

    return pipeline;
}
