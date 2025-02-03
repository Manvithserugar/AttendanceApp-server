const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const dataFile = "./data.json";

// Helper function to read data from the JSON file
const readData = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify({ students: [] }, null, 2));
    }
    const rawData = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(rawData);
  } catch (error) {
    // If the file doesn't exist or is invalid, return default data
    console.error("Error reading data.json:", error);
    return { students: [] };
  }
};

// Helper function to write data to the JSON file
const writeData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

app.post("/students/attendance/date", (req, res) => {
  if (req.body.date) {
    let { students } = readData();
    const attendanceForDate = students.filter((student) =>
      student.dates.includes(req.body.date)
    );
    attendanceForDate.forEach((student) => {
      delete student.dates;
    });
    if (!attendanceForDate) return res.status(204).send();
    res.json(attendanceForDate);
  } else {
    let { students } = readData();
    students = students.map((student) => {
      student.dates = student.dates.slice(-4);
      return student;
    });
    res.json(students);
  }
});

app.get("/students/:id", (req, res) => {
  let { students } = readData();
  const studentId = parseInt(req.params.id);
  const studentData = students.find((student) => student.id === studentId);
  const student = {
    id: studentData.id,
    name: studentData.name,
    email: studentData.email,
    phone: studentData.phone,
  };
  res.json(student);
});

app.post("/students", (req, res) => {
  const newStudent = req.body;
  let { students } = readData();
  if (
    students.some(
      (student) =>
        student.email === newStudent.email || student.phone === newStudent.phone
    )
  ) {
    return res
      .status(400)
      .send("Student with this email or phone number already exists!");
  }
  newStudent.id =
    students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
  newStudent.total = 0;
  newStudent.consecutiveCount = 0;
  newStudent.streakOfFour = 0;
  newStudent.dates = [];
  newStudent.paidDates = "";
  students.push(newStudent);
  writeData({ students });
  res.status(201).send();
});

app.put("/students/:id", (req, res) => {
  let { students } = readData();
  const studentId = parseInt(req.params.id);
  const updateBody = req.body;
  students = students.map((student) => {
    if (student.id === studentId) {
      student.name = updateBody.name;
      student.email = updateBody.email;
      student.phone = updateBody.phone;
      if (updateBody.lastPaidDate !== student.lastPaidDate)
        student.lastPaidDate = updateBody.lastPaidDate;
    }
    return student;
  });
  writeData({ students });
  res.json(updateBody);
});

app.delete("/students/:id", (req, res) => {
  let { students } = readData();
  const studentId = parseInt(req.params.id);
  students = students.filter((student) => student.id !== studentId);
  writeData({ students });
  res.status(204).send();
});

app.post("/students/attendance", (req, res) => {
  let { date, Ids } = req.body;
  let { students } = readData();

  students = students.map((student) => {
    if (Ids.includes(student.id)) {
      student.total++;
      student.consecutiveCount = student.total % 4;
      if (student.consecutiveCount === 0) {
        student.streakOfFour++;
      }
      student.dates.push(date);
    }
    return student;
  });

  writeData({ students });

  res.status(201).send();
});

app.delete("/students/attendance", (req, res) => {
  students = readData();
  students = students.map((student) => {
    student.total = 0;
    student.consecutiveCount = 0;
    student.streakOfFour = 0;
    student.dates = [];
    return student;
  });
  writeData({ students });
  res.status(200).send();
});

app.delete("/students", (req, res) => {
  writeData({ students: [] });
  res.status(200).send();
});

app.get("/", (req, res) => {
  res.status(200).send("server reached");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
