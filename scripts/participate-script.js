import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

let auctionCodes = []

const firebaseConfig = {
databaseURL: "https://auction-app-ipl-6099d-default-rtdb.asia-southeast1.firebasedatabase.app/",

};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const auctionRef = ref(database, "auction-codes");


get(auctionRef).then(snapshot => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    auctionCodes = Object.values(data);

    console.log(auctionCodes);
  } else {
    auctionCodes = [];
  }
});




document.querySelector(".js-auction-code-input-field").addEventListener("input" , ()=>{
    const user_code = document.querySelector(".js-auction-code-input-field").value

    const best_match = uni_func(user_code , auctionCodes)
    console.log(best_match)
    const resultDiv = document.querySelector(".js-result-div")
    resultDiv.innerHTML = ""
    best_match.forEach(
        (best)=>{
            resultDiv.innerHTML += `<div class="top-search js-top-search">${best}</div>`
        }
    )

    document.querySelectorAll(".js-top-search").forEach(
      (element)=>{
        element.addEventListener(
          "click" , ()=>{
            const auctionDataRef = ref(database , `${element.innerHTML}`)

            let auctionData;
            get(auctionDataRef).then((snapshot)=>{
              if(snapshot.exists()){
                auctionData = snapshot.val();
                console.log(auctionData)
              }
              else{
                console.log("Auction data not found!")
              }

              localStorage.setItem(
              "auction-data" , JSON.stringify(auctionData)
              )

              window.open("participate-select-team-room.html" , "_blank");
            })

            
          }
        )
      }
    )
})

if(localStorage.getItem("auctioneer") === "true"){
  
  console.log("you are the auctioneer");
}else{
  console.log("No not auctioneer");
}



function score_func(quiz_code , user_quiz_code){
  let score = 0
  quiz_code = lower_case_convertor(quiz_code)
  quiz_code = quiz_code.split("")
  user_quiz_code = user_quiz_code.split("")

  for(let i = 0 ; i < user_quiz_code.length ; i++){
    let ch = user_quiz_code[i]
    let match_found = false
    let index = null
    for(let j = 0; j < quiz_code.length;j++){
      if(ch === quiz_code[j]){
        match_found = true;
        index = j
        break
      }
    }
    if(match_found){
      score = score + 1
      quiz_code.splice(index , 1)
    }
  }
  return score
}

function uni_func(user_quiz_code , quiz_codes){
  let best_match_list = []
  let quiz_codes_dict = {}
  quiz_codes.forEach(
    (quiz_code) =>{
      let score = score_func(lower_case_convertor(quiz_code) , user_quiz_code)
      quiz_codes_dict[quiz_code] = score
    }
  )



  for(let i = 0; i < 3 ; i++){
    let best_match = ""
    let maxi = 0
    for(let [key , score] of Object.entries(quiz_codes_dict)){
      score = quiz_codes_dict[key]
      if(score > maxi){
        maxi = score
        best_match = key
      }
    }
    if(best_match){
      best_match_list.push(best_match)
      delete quiz_codes_dict[best_match]
      
    }
  }

  return best_match_list


}

function lower_case_convertor(user_quiz_code){
  let temp_str = ""
  for(let i = 0 ; i < user_quiz_code.length ; i++)
  {
    let ch = user_quiz_code[i]
    if(ch.charCodeAt(0) > 64 && ch.charCodeAt(0) < 91){
      ch = String.fromCharCode(ch.charCodeAt(0) + 32)
    }
    temp_str = temp_str + ch
  }
  return temp_str
}