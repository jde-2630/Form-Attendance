// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyCZu2O_dZG3NrbMNesHcVL6Mc2tm-JT0hQ",
  authDomain: "sample-b492e.firebaseapp.com",
  databaseURL: "https://sample-b492e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sample-b492e",
  storageBucket: "sample-b492e.firebasestorage.app",
  messagingSenderId: "228031625953",
  appId: "1:228031625953:web:9494c5a0511229813f15a0",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.getElementById('date').value = new Date().toISOString().split('T')[0];

// Switch UI
function showSection(id){
    document.querySelectorAll('.section').forEach(sec=>sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Submit Attendance
function submitForm(){
    const record = {
        studentName: studentName.value.trim(),
        gradeLevel: gradeLevel.value,
        lrn: lrn.value.trim(),
        subject: subject.value.trim(),
        overallAttendance: overallAttendance.value,
        date: date.value
    };

    if(!record.studentName || !record.lrn || isNaN(record.lrn)){
        errorMessage.textContent = "Please fill all fields correctly.";
        return;
    }

    db.ref("attendance").push(record);
    attendanceForm.reset();
    date.value = new Date().toISOString().split('T')[0];
    showSection("submittedSection");
}

// Password unlock
function checkPassword(event){
    event.preventDefault();
    if(password.value === "jdej"){
        recordsDisplay.style.display = "block";
        loadRecords();
    } else {
        passwordError.textContent = "Incorrect password.";
    }
}

// Load & Display Records
let attendanceData = {};

function loadRecords(){
    db.ref("attendance").on("value", snapshot=>{
        attendanceData = snapshot.val() || {};
        displayRecords(attendanceData);
    });
}

// Display + Sort + Search
function displayRecords(data){
    const keys = Object.keys(data);
    if(keys.length === 0){
        noRecords.style.display = "block"; return;
    }
    noRecords.style.display = "none";

    // Convert to array
    let arr = keys.map(k => ({id:k, ...data[k]}));

    // Sort → grade level then date
    arr.sort((a,b)=>{
        if(a.gradeLevel === b.gradeLevel){
            return new Date(a.date) - new Date(b.date);
        }
        return a.gradeLevel.localeCompare(b.gradeLevel);
    });

    const container = document.getElementById("recordsContainer");
    container.innerHTML = "";

    // Group by grade
    const grouped = {};
    arr.forEach(r=>{
        if(!grouped[r.gradeLevel]) grouped[r.gradeLevel] = [];
        grouped[r.gradeLevel].push(r);
    });

    for(const grade in grouped){
        const table = document.createElement("table");
        table.innerHTML = `<h3>${grade}</h3>
            <tr>
                <th>Name</th><th>LRN</th><th>Subject</th>
                <th>Attendance</th><th>Date</th>
            </tr>`;

        grouped[grade].forEach(r=>{
            table.innerHTML += `
                <tr>
                    <td>${r.studentName}</td>
                    <td>${r.lrn}</td>
                    <td>${r.subject}</td>
                    <td>${r.overallAttendance}</td>
                    <td>${r.date}</td>
                </tr>`;
        });

        container.appendChild(table);
    }
}

// Search
function searchRecords(){
    const query = document.getElementById("searchInput").value.toLowerCase();
    const filtered = {};

    Object.entries(attendanceData).forEach(([id, rec])=>{
        if(Object.values(rec).some(v=>String(v).toLowerCase().includes(query))){
            filtered[id] = rec;
        }
    });

    displayRecords(filtered);
}

// Delete Requires Password
function requestDelete(){
    let pw = prompt("Enter delete password:");
    if(pw === "jadejj"){
        db.ref("attendance").remove();
        alert("All records deleted.");
    } else {
        alert("Incorrect password.");
    }
}

// CSV Export
function downloadCSV(){
    let rows = [["Name","LRN","Subject","Attendance","Date","Grade Level"]];
    Object.values(attendanceData).forEach(r=>{
        rows.push([r.studentName,r.lrn,r.subject,r.overallAttendance,r.date,r.gradeLevel]);
    });

    let csv = rows.map(e=>e.join(",")).join("\n");
    let blob = new Blob([csv], {type:"text/csv"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "attendance_records.csv";
    a.click();
}
