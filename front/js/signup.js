
const loginbutton = document.querySelector(".login-button");

const msgBox = document.querySelector('.signmsg-box');
const signmsgSuccessfull = document.querySelector('.signmsg-successfull');

document.getElementById('signupForm').setAttribute('autocomplete', 'off');


document.getElementById('signupForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  var userDataForm = document.getElementById("signupForm");

  var username = document.getElementById('username').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  console.log('Username:', username);
  console.log('Email:', email);
  console.log('Password:', password);

  var userData = {
    username: username,
    password: password,
    email: email,
  };

  fetch("/submitUserData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.ok) {
        userDataForm.reset();
        // errormsg.style.display = "none";
        // registeredmsg.style.display = "block";
        signmsgSuccessfull.style.display = 'block';
        
        setTimeout(function () {
          // console.log("page changed");
          localStorage.setItem("authenticatedUser", "granted");

          window.location.href = "/login";
        }, 500);

        return response.json();
      } else if (response.status === 400) {

        msgBox.style.display = 'block';

        setTimeout(function () {
          msgBox.style.display = 'none';
        }, 3000);

        return response.json();
      } else {
        throw new Error("Server Error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });

});

loginbutton.addEventListener("click", function () {
  localStorage.setItem("authenticatedUser", "denied");

  window.location.href = "/login";
});