const welcomeUser = document.querySelector(".welcome-user");
const logOutbutton = document.querySelector(".logout-button");
const errorContainer = document.querySelector(".error-container");

const socket = io();
const chatForm = document.getElementById("chat-form");
const recipientNames = document.querySelector(".reciepientdata-div");
const chatMessages = document.querySelector(".chat-messages");
const div = document.createElement("div");
div.classList.add("recipent-name");

let recipentslist = [];

const reciepientnameContainer = document.querySelector(".messageuser-header");

let fromUser;
let toUser;




function storeDetails() {
  div.style.display = "block";
  console.log("username:", fromUser);
  // fromUser = document.getElementById('from').value;

  let name = document.getElementById("to").value;

  var recieverData = {
    name: name,
  };

  fetch("/searchrecieverData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recieverData),
  })
    .then((response) => {
      if (response.ok) {
        console.log("user found");
        unshowwhileUserchange();
        toUser = name;
        div.innerHTML = "";

        div.innerHTML = `<h3 >${toUser}
          </h3>`;
        reciepientnameContainer.appendChild(div);

        // element = document.querySelectorAll(".chat-messages");
        socket.emit("userDetails", { fromUser, toUser });
      } else if (response.status === 400) {
        div.innerHTML = "";
        div.innerHTML = `<p>User not found, Try Again!</p>`;
        reciepientnameContainer.appendChild(div);
        unshowwhileUserchange();

        setTimeout(function () {
          div.style.display = "none";
        }, 3000);
        console.log("not fouund!!!!!");
      } else {
        throw new Error("Server Error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}


// Submit message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value;
  const final = {
    fromUser: fromUser,
    toUser: toUser,
    msg: msg,
  };
  socket.emit("chatMessage", final);
  document.getElementById("msg").value = "";
});

socket.on("userListOutput", (data) =>{
    console.log("userlist",data);
    data.forEach((message) => {
      console.log("Received message:", message);
      userList(message);
    });
    recipientNames.scrollTop = recipientNames.scrollHeight;
})


socket.on("output", (data) => {
  console.log(data);

  data.forEach((message) => {
    outputMessage(message);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("message", (data) => {
  outputMessage(data);

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function unshowwhileUserchange() {

  while (chatMessages.firstChild) {
    chatMessages.removeChild(chatMessages.firstChild);
  }
}



function userList(message) {
  console.log("message got", message);

  // Assuming message is an object with properties you want to display
  const div = document.createElement("div");
  div.classList.add("recipientname");
  div.innerHTML = `<p>${message}
  </p>`;
  const recipientNames = document.getElementById("recipientNames");
  if (recipientNames) {
    recipientNames.appendChild(div);
  }
}


function outputMessage(message) {
  console.log("message got", message);

  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.from}<span> ${message.time}, ${message.date}</span></p>
    <p class ="text">
        ${message.message}
    </p>`;
  chatMessages.appendChild(div);
}

const authenticatedUser = localStorage.getItem("authenticatedUser");
if (authenticatedUser != "granted") {
  window.location.href = "/login";
}

document.addEventListener("DOMContentLoaded", function () {
  
  fetch("/getUsername")
    .then((response) => response.json())
    .then((data) => {
      console.log("data got", data);
      fromUser = data.loginusername;
      socket.emit('login', { fromUser});
      socket.emit('userlist',  { fromUser});
      welcomeUser.textContent += data.loginusername;
    })
    .catch((error) => console.error("Error:", error));

   
  // showupdatedrecipientlist();
});

logOutbutton.addEventListener("click", function () {
  localStorage.setItem("authenticatedUser", "denied");
  socket.emit('logout');

  window.location.href = "/login";
});

recipientNames.addEventListener("click", function (event){
  console.log("username:", fromUser);
  const clickedrecievername = event.target.closest(".recipientname").textContent;
  
  unshowwhileUserchange();
  const inputString = clickedrecievername
  const resultString = inputString.split('\n')[0];
  toUser = resultString;
    console.log("recipient name:",toUser);
    // element = document.querySelectorAll(".chat-messages");
    socket.emit('userDetails',{fromUser,toUser});
  
  div.innerHTML = "";
  div.innerHTML = `<h3 >${toUser}
    </h3>`;
  reciepientnameContainer.appendChild(div);
    
})