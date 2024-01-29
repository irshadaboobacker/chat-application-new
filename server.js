const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const bodyParser = require("body-parser");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/chatMessage");
const mongoClient = require("mongodb").MongoClient;

const dbname = "chatApp";
const chatCollection = "chats";
const userCollection = "onlineUsers";
const signupCollection = "users";

const port = 3000;
const database = "mongodb+srv://Irshadta:GBp1f9tvZCQjnRsj@cluster0.q3zzqd7.mongodb.net/";
const app = express();

const server = http.createServer(app);
const io = socketio(server);

let loginusername;

mongoose.connect("mongodb+srv://Irshadta:GBp1f9tvZCQjnRsj@cluster0.q3zzqd7.mongodb.net/chatApp");
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.json());

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

app.use(express.static(path.join(__dirname, "public")));

app.post("/submitUserData", async (req, res) => {
  const userData = req.body;
  userData.password = simpleHash(userData.password);
  // console.log("User Data:", userData);

  try {
    const existingUser = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }],
    });

    if (existingUser) {
      res.status(400).json({ error: "Username or email already exists." });
    } else {
      const newUser = new User(userData);
      await newUser.save();
      res.json({ message: "User data received and saved successfully!" });
    }
  } catch (error) {
    // console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/submitloginUserData", async (req, res) => {
  const loginuserData = req.body;
  loginuserData.password = simpleHash(loginuserData.password);
  // console.log("User Data:", loginuserData);

  try {
    const existingUser = await User.findOne({
      $or: [
        { username: loginuserData.nameorEmail },
        { email: loginuserData.nameorEmail },
      ],
      password: loginuserData.password,
    });

    if (existingUser) {
      loginusername = existingUser.username;

      res.json({ message: "User found" });
    } else {
      res.status(400).json({ error: "usernot found" });
      // console.log("user not found");
    }
  } catch (error) {
    // console.log("error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/searchrecieverData", async (req, res) => {
  const loginuserData = req.body;
  //  console.log("search User Data:", loginuserData.name);

  try {
    const existingUser = await User.findOne({
      username: loginuserData.name,
    });

    if (existingUser) {
      res.json({ message: "User found" });
    } else {
      res.status(400).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getUsername", (req, res) => {
  res.json({ loginusername });
  // console.log("user found", loginusername);
});



io.on("connection", (socket) => {
  console.log("New User Logged In with ID " + socket.id);


  socket.on("chatMessage", (data) => {
    
    var dataElement = formatMessage(data);
    mongoClient.connect(database, (err, db) => {
      if (err) throw err;
      else {
        var onlineUsers = db.db(dbname).collection(userCollection);
        var chat = db.db(dbname).collection(chatCollection);
        chat.insertOne(dataElement, (err, res) => {
          
          if (err) throw err;
          socket.emit("message", dataElement); 
        });
        onlineUsers.findOne({ name: data.toUser }, (err, res) => {
          //checks if the recipient of the message is online
          if (err) throw err;
          if (res != null){
             //if the recipient is found online, the message is emmitted to him/her
          console.log(dataElement);
          socket.to(res.ID).emit("message", dataElement);

          }
           db.close();
           
        });
      }
     
    });
  });

  socket.on("login", (data) =>{
    mongoClient.connect(database, function (err, db) {
      if (err) throw err;
      var onlineUser = {
        ID: socket.id,
        name: data.fromUser,
      };
      
      var online = db.db(dbname).collection(userCollection);
      online.insertOne(onlineUser, (err, res) => {
        if (err) throw err;
        console.log(onlineUser.name + " online");
        db.close();
      });
      
    });
  });


  socket.on("userlist", (data) => {
    mongoClient.connect(database, (err, db) => {
      if (err) throw err;
      else {
        var chatlistCollection = db.db(dbname).collection(chatCollection);
  
        chatlistCollection.find({
          $or: [
            { from: data.fromUser },
            { to: data.fromUser }
          ]
        })
         .sort({_id: -1}) 
        .toArray((err, res) => {
          if (err) throw err;
          else {
            // Extract user names from the documents
            const userNames = res.map(doc => doc.from === data.fromUser ? doc.to : doc.from);
            
            // Remove duplicates and emit the result
            const uniqueUserNames = [...new Set(userNames)];
            socket.emit("userListOutput", uniqueUserNames);
          }
          db.close();
        });
      }
    });
  });
  

  socket.on("userDetails", (data) => {
    mongoClient.connect(database, (err, db) => {
      if (err) throw err;
      else {
        var onlineUser = {
          ID: socket.id,
          name: data.fromUser,
        };
        var currentCollection = db.db(dbname).collection(chatCollection);
         var online = db.db(dbname).collection(userCollection);
        // online.insertOne(onlineUser, (err, res) => {
        //   if (err) throw err;
        //   // console.log(onlineUser.name + " online");
        // });
        currentCollection
          .find(
            {
              from: { $in: [data.fromUser, data.toUser] },
              to: { $in: [data.fromUser, data.toUser] },
            },
            { projection: { _id: 0 } }
          )
          .toArray((err, res) => {
            if (err) throw err;
            else {
              //console.log(res);
              socket.emit("output", res); 
              db.close();
            }
          });
      }
      
    });
  });
  var userID = socket.id;
  socket.on("logout", () => {   
    mongoClient.connect(database, function (err, db) {
      if (err) throw err;
      var onlineUsers = db.db(dbname).collection(userCollection);
      var myquery = { ID: userID };
      onlineUsers.deleteOne(myquery, function (err, res) {
        if (err) throw err;
        console.log("User " + userID + " offline");
        db.close();
      });
    });
  });
});

app.use(express.static(path.join(__dirname, "front")));

app.get("/home", (req, res) => {
  const filePath = path.join(__dirname, "front", "chat.html");
  res.sendFile(filePath);
});

app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "front", "login.html");
  res.sendFile(filePath);
});
app.get("/login", (req, res) => {
  const filePath = path.join(__dirname, "front", "login.html");
  res.sendFile(filePath);
});

app.get("/signup", (req, res) => {
  const filePath = path.join(__dirname, "front", "signup.html");
  res.sendFile(filePath);
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
