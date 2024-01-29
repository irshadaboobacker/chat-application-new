
const msgBox = document.querySelector('.msg-box');
const signinbutton = document.querySelector(".signin-button");



document.getElementById('loginForm').setAttribute('autocomplete', 'off');

document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Prevents the default form submission
  var userDataForm = document.getElementById("loginForm");
  
  // Retrieve values from the form
  var nameorEmail = document.getElementById('nameoremail').value;
  var password = document.getElementById('password').value;

  // Now you can use usernameOrEmail and password as needed
  console.log('Username or Email:', nameorEmail);
  console.log('Password:', password);

  var userData = {
    nameorEmail: nameorEmail,
    password: password,
  };

  fetch("/submitloginUserData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (response.ok) {
        localStorage.setItem("authenticatedUser", "granted");

        window.location.href = "/home";
      } else if (response.status === 400) {
         msgBox.style.display = 'block';

        setTimeout(function () {
          msgBox.style.display = 'none';
        }, 3000);
        console.log("not fouund!!!!!");
      } else {
        throw new Error("Server Error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });




});


signinbutton.addEventListener("click", function () {
  localStorage.setItem("authenticatedUser", "denied");

  window.location.href = "/signup";
});