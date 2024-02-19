const Course = require("../models/Course");
const trainingcourses = require("../models/Courses");
const batches = require("../models/Batch");
const { getWeekAndDates } = require("../utils/getWeekAndDates");
const { getCompletedCourseCount } = require("../utils/getCompletedCourseCount");
const user = require("../models/UserModel");
const jobroles = require("../models/JobRoles");
const { findOneJobRole } = require("../services/jobRoleService");

exports.getAllCoursesService = async (role) => {
  // filter according to role of user (SD,DE,ML etc)
  let courses = await Course.find({ Role: "SD" }).lean();
  // array to store objects of startDate and endDate of
  // every individual course
  let completionStatus = [];
  // refactoring the fetched data
  courses.forEach((courseObject, courseObjectindex) => {
    let courseData = courseObject.data;
    courseData.forEach((courseDataObject, courseDataObjectindex) => {
      let datesData = courseDataObject.days;
      datesData.forEach((datesDataObject, index) => {
        // add current date and week to data
        let modifiedObject = {
          ...getWeekAndDates(courseObject.startdate, datesDataObject.DAY),
        };
        datesDataObject = { ...datesDataObject, ...modifiedObject };
        courses[courseObjectindex].data[courseDataObjectindex].days[index] = {
          ...datesDataObject,
        };
      });
      // push values in the array
      let duration = courseDataObject.days.length;
      completionStatus.push({
        startDate: courseDataObject.days[0].date,
        endDate: courseDataObject.days[duration - 1].date,
      });
    });
  });

  courses[0] = {
    ...getCompletedCourseCount(completionStatus),
    ...courses[0],
  };
  return courses;
};


exports.getCoursesService = async (jobRole, batch) => {
  const courses = await trainingcourses.find({ jobRole: jobRole, batch: batch }).lean();
  exports.getCoursesService = async (jobRole, batch) => {
    const courses = await trainingcourses.find({ jobRole: jobRole, batch: batch }).lean();

    return courses;
  };
  return courses;
};

exports.getACourseService = async (id) => {
  let course = await exports.findOneCourse({_id: id});
  if(course !== null) {
    return {
      _id: course._id,
      courseDuration: course.courseDuration,
      label: course.courseType,
      course: course.courseName,
      description: course.courseDescription,
      courseContent: course.details,
      courseUrl: course.courseURL,
      assessmentUrl: course.assessmentURL,
      assignmentUrl: course.assignmentURL,
      days: Array.from(Array(course.courseDuration).keys()).map((_, i) => {
        return {
          DAY: i+1,
          startTime: "09:00",
          endTime: "13:00",
          label: "COURSE"
        }
      })
    }
  }
  else {
    return null;
  }
};

// DB Query to fetch a single course for the respective query params
exports.findOneCourse = async (query) => {
  try {
    return await trainingcourses.findOne(query).lean();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DB Query to fetch all courses for the respective query params
exports.findAllCourse = async (query) => {
  try {
    return await trainingcourses.find(query).lean();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DB Query to fetch selective fields
exports.findbySelectField = async (query, selectfield) => {
  try {
    return await trainingcourses.find(query, selectfield).lean();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DB Query to create a single course for the respective request body
exports.createCourse = async (body) => {
  try {
    return await trainingcourses.create(body);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

exports.updateCourse = async (courseId, body) => {
  try {
    return await trainingcourses.findByIdAndUpdate(courseId, body, { new: true });
  } catch (error) {
    console.error(error);
    throw error;
  }
};


exports.deleteCourse = async (courseId) => {
  const session = await trainingcourses.startSession();
  session.startTransaction();

  try {
    const deletedCourse = await trainingcourses.deleteOne({ "_id": courseId }).session(session);

    if (deletedCourse.deletedCount === 1) {
      const updateResult = await batches.updateMany({ "coursesID": courseId }, { $pull: { "coursesID": courseId } }).session(session);

      if (updateResult.acknowledged === true) {
        await session.commitTransaction();
        session.endSession();
        return deletedCourse;
      } else {
        await session.abortTransaction();
        session.endSession();
        throw new Error("Failed to update batches with the removed course.");
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Course not found or deletion failed.");
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


exports.deleteBulkCourses = async (courseIDs) => {
  const session = await trainingcourses.startSession();
  session.startTransaction();

  try {
    const deletedCourses = await trainingcourses.deleteMany({ "_id": { $in: courseIDs } }).session(session);

    if (deletedCourses.deletedCount > 0) {
      const updateResult = await batches.updateMany({ "coursesID": { $in: courseIDs } }, { $pull: { "coursesID": { $in: courseIDs } } }).session(session);
      if (updateResult.acknowledged === true) {
        await session.commitTransaction();
        session.endSession();
        return deletedCourses;
      } else {
        await session.abortTransaction();
        session.endSession();
        throw new Error("Failed to update batches with the removed courses.");
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Course not found or deletion failed.");
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error)
    throw error;
  }
};
// DB Query to fetch a single course for the respective query params
exports.findOneCourse = async (query) => {
  return await trainingcourses
    .findOne(query)
    .lean()
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

// DB Query to fetch all courses for the respective query params
exports.findAllCourse = async (query) => {
  return await trainingcourses
    .find(query)
    .lean()
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

// DB Query to fetch selective fields
exports.findbySelectField = async (query, selectfield) => {
  return await trainingcourses
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

// DB Query to create a single course for the respective request body
exports.createCourse = async (body) => {
  return await trainingcourses
    .create(body)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

exports.calculateDate = (startDate, durationInDays) => {
  try {

    const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

    let currentDate = new Date(startDate); // Start from the provided start date
    let remainingDuration = durationInDays; // Remaining duration to be adjusted for weekends

    while (remainingDuration > 0) {
      // Move to the next day
      currentDate.setTime(currentDate.getTime() + millisecondsPerDay);

      // Check if the current day is not a weekend (0 = Sunday, 6 = Saturday)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        remainingDuration--;
      }
    }
    // Adjust for weekends, and currentDate will now be the end date
    return currentDate;

  } catch (error) {
    throw new Error("Error converting start date: " + error.message);
  }
};

exports.getCoursesServiceV2 = async (email) => {
  let userDetails = await user.findOne({ email: email }).lean();
  let batchId = null;
  if (userDetails.batchId.length !== 0) {
    batchId = userDetails.batchId[userDetails.batchId.length - 1];
  }
  let batch = await batches.findById(batchId).lean();
  let roles = [];
  for (let role of batch.role) {
    let r = await jobroles.findById(role).lean();
    roles.push({ roleName: r.roleName, id: role });
  }
  batch.role = roles;
  let courseId = batch.coursesID;
  let jobRole = await findOneJobRole({ roleName: userDetails.jobRole });
  let courses = (await exports.findAllCourse({ _id: { $in: courseId }, $or: [{ jobRole: jobRole._id }, { jobRole: null }] }));
  let output = [{
    completed_course: 0,
    progressed_course: 0,
    total_course: 0,
    startdate: batch.start_date.toISOString().split("T")[0],
    Role: jobRole.roleName,
    data: []
  }];
  if(courses.length !== 0) {
    courses.sort((a, b) => (a.courseStarting | 0) - (b.courseStarting | 0));
    let day = courses[0].courseStarting ? courses[0].courseStarting : 0;
    output[0]["data"] = courses.map(course => {
      return {
        _id: course._id,
        courseDuration: course.courseDuration,
        label: course.courseType === "Technical Skills Training" ? "technical" : "soft courses",
        course: course.courseName,
        description: course.courseDescription,
        courseContent: course.details,
        days: Array.from(Array(course.courseDuration).keys()).map((_, i) => {
          let temp1 = getWeekAndDates(batch.start_date.toISOString().split("T")[0], day+1);
          let temp2 = getWeekAndDates(batch.start_date.toISOString().split("T")[0], (course.courseStarting ? course.courseStarting : day)+1);
          let temp = temp1.date < temp2.date ? temp2 : temp1;
          day = temp1.date < temp2.date ? (course.courseStarting ? course.courseStarting : day)+1 : day+1;
          return {
            DAY: day,
            label: "COURSE",
            startTime: "09:00",
            endTime: "13:00",
            ...temp
          }
        })
      }
    });
    let completionStatus = output[0]["data"].map((courses) => {
      let duration = courses.days.length;
      return {
        startDate: courses.days[0].date,
        endDate: courses.days[duration - 1].date,
      }
    });
    output[0] = {
      ...output[0],
      ...getCompletedCourseCount(completionStatus)
    };
  }
  return output;
}