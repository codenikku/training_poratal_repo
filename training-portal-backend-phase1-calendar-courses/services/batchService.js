const batch = require("../models/Batch");
const trainingcourses = require("../models/Courses");
const user = require("../models/UserModel");
const WeeklyStatus = require("../models/weeklyStatus");
const jobroles = require("../models/JobRoles");
const {format_date} = require("../utils/batchHelper");
const {createWeeklyStatusForUser} = require('../controllers/weeklyStatusesController')

// DB Query to fetch selective fields
exports.findbySelectField = async (query, selectfield) => {
  return await batch
    .find(query, selectfield)
    .lean()
    .then((response) => {
      return response[0];
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

exports.getAllBatchesService = async () => {
  // console.log("Get All Batches Service Called..");
  try {
    let batches = await batch.find({}).lean();
    for(let batch of batches)
    {
      batch.start_date=format_date(batch.start_date);
      batch.end_date=format_date(batch.end_date);
      batch.updated_on=format_date(batch.updated_on);
      batch.id = batch._id;
    }



    return batches;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

exports.getABatchService = async (id) => {
      try 
      {
        let fetchedBatch = await batch.findById(id).lean();
        let roles = [];
        for(let role of fetchedBatch.role)
        {
          let r = await jobroles.findById(role).lean();
          roles.push({roleName :r.roleName , id:role});
        }
        fetchedBatch.role = roles;
        return fetchedBatch;
      } 
      catch (error) 
      {
         console.log("error" , error);
        throw error;
      }
}

exports.addBatchService = async (batches) => {
  try {

    for (const batchData of batches) {
      // Create a new instance of the DataModel for each object
      const newBatch = new batch(batchData);
      await newBatch.save();
    }
    return true;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};
  
exports.deleteBatchesService = async (ids) => {
  try {
      const result = await batch.deleteMany({ _id: { $in: ids } });

      const updatedUsers = await user.updateMany({ batchId: { $in: ids } }, { $pull: { batchId: { $in: ids } } });

      await WeeklyStatus.updateMany({ batchId: { $in: ids } } , { $pull: { batchId: { $in: ids } } });
    return result.deletedCount;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

exports.updateBatchService = async (id, batchToUpdate, interns) => {
  try {
    const initialBatchStart = await batch.find({_id:id},{_id:0,start_date:1})
    
    const initialBatchData = await user.find({ batchId:  { $in: [id] } }).select('_id').lean();
    const userIds = initialBatchData.map(user => user._id.toString());


    let removedInterns
    let emailsArray



    
    const updatedBatch = await batch.findByIdAndUpdate(id, batchToUpdate, { new: true });
  
    const result = await user.updateMany({ batchId: id  , role:'Intern'},{ $pull: { batchId: id } } );

    
    const addedInterns = await user.updateMany({ _id: { $in: interns } },{ $push: { batchId: id } });

    if(initialBatchData.length>0){
      removedInterns=userIds.filter(element => !interns.includes(element));
      const removedEmails = await user.find({_id: { $in:removedInterns}})
      removedEmails.forEach( async (userData)=>{
        if(userData.status === true){
        const ans = await createWeeklyStatusForUser(userData)
      }
      })

    }
    
    interns.forEach( async (item)=>{
      const userData = await user.findById(item);
      if(userData.status === true){
      const ans = await createWeeklyStatusForUser(userData)
    }
    })
    return true;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

exports.getCoursesNameandIdService = async () => {
  try {
    const courses = await trainingcourses.aggregate([
      {
        $group: {
          _id: "$courseName",
          data: {
            $push: {
              jobRole: "$jobRole",
              _id: "$_id",
              courseType:"$courseType",
            },
          },
        },
      },
      {
        $project: {
          courseName: "$_id", // Rename _id to name
          data: 1,
          _id: 0, // Exclude _id from the output
        },
      },
    ]);

    return courses;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};