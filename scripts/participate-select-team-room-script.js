import { cricPlayers ,nationalityList} from "./players-list.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set ,push ,onValue ,get} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
databaseURL: "https://auction-app-ipl-6099d-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const auctionData = JSON.parse(localStorage.getItem("auction-data"));
const auctioneer = localStorage.getItem("auctioneer");
let notSelectedPlayers = [];
let playersRetentionList = [];
let playerRetentionAmount = 0;
await getNotSelectedPlayers();
if(auctionData['joined'] === 'yes'){
    updateUI(auctionData['myName']);
}

if(auctioneer === "true"){
    const startAuctionButton = document.createElement("button");
    startAuctionButton.innerHTML = "Start Auction";
    startAuctionButton.classList.add("start-auction-btn");
    startAuctionButton.classList.add("js-start-auction-btn");
    document.querySelector(".js-current-players-list").appendChild(startAuctionButton);
}
let playersJoinedList = [];

get(ref(db , `${auctionData.auctionCode}/playersJoined`)).then((snapshot)=>{
    if(snapshot.exists()){
        playersJoinedList = Object.values(snapshot.val());
        updatePlayersList(playersJoinedList);
        removeTeam(playersJoinedList);
    }
})


document.querySelectorAll(".js-team-logo").forEach(
    (element)=>{
        
        element.addEventListener("click" , ()=>{

            if(element.classList.contains("select-team-style")){
                element.classList.remove("select-team-style")
                

                const already_exists = document.querySelector(".join-button");
                if(already_exists){
                    already_exists.remove();
                }
                return;
            }

            uncheckTheStyleForElement()
            element.classList.add("select-team-style")


            const already_exists = document.querySelector(".join-button");
            if(already_exists){
                already_exists.remove();
            }


            const joinButton = document.createElement("button");
            joinButton.innerHTML = "JOIN";
            joinButton.classList.add("join-button-styles")
            joinButton.classList.add("join-button");
            joinButton.setAttribute("data-team-name" , element.dataset.teamName);

            remainingTasks(element.dataset.teamName);
            
            document.querySelector(".js-content-div").appendChild(joinButton);
            
            document.querySelector(".join-button").addEventListener("click" ,(e)=>{
                
                updateToDb(e.target);
                //updating UI
                updateUI(e.target.dataset.teamName);

                //local storage update
                auctionData['joined'] = 'yes';
                auctionData['myName'] = e.target.dataset.teamName;
                localStorage.setItem("auction-data" , JSON.stringify(auctionData));

                //set retention data to db
                console.log("purseAmount", auctionData.purseAmount, "playerRetentionAmount", playerRetentionAmount);

                retentionDataToDb(playersRetentionList , playerRetentionAmount , e.target.dataset.teamName);

                // remove join button
                const already_exists = document.querySelector(".join-button");
                if(already_exists){
                    already_exists.remove();
                }
            });
        })
    }
)

const startAuctionButton = document.querySelector(".js-start-auction-btn");

if(startAuctionButton){
    startAuctionButton.addEventListener("click", () => {
        set(ref(db, `${auctionData.auctionCode}/auctionStarted`), true);
    });
}

async function getNotSelectedPlayers(){
    const snapshot = await get(ref(db , `${auctionData.auctionCode}/notSelectedPlayers`));
    if(snapshot.exists()){
        notSelectedPlayers.push(...Object.values(snapshot.val()));
    }
}

function uncheckTheStyleForElement(){
    document.querySelectorAll(".js-team-logo").forEach(
        (element)=>{
            if(element.classList.contains("select-team-style"))
                element.classList.remove("select-team-style")
        }
    )
    
}

async function updateToDb(element){
    await push(ref(db , `${auctionData.auctionCode}/playersJoined`) , element.dataset.teamName);
    
}
function removeTeam(arr){
    for(let i = 0; i < arr.length ; i++){
        const element = document.querySelector(`.${arr[i]}`);
        if(element)
            element.remove();
    }
}

function updatePlayersList(arr){
    const list = document.querySelector(".js-players-list");

    if(arr.length == 0 || arr[0] === true){
        list.innerHTML = 'No players joined yet';
        return;
    }
    
    let str = ``;
    for(let i = 0; i < arr.length ; i++){
        if(arr[i] == true)
            continue;
        str += `<li>${String(arr[i]).toUpperCase()}</li>`;
    }
    list.innerHTML = str;
    
    
}
function updateUI(teamName){
    document.querySelector(".js-content-div").innerHTML = `
        <div class="wait-message-box">
            <span class="team">${teamName.toUpperCase()}</span><br><br>
            Please wait for the host to start the auction...
        </div>
    `;
}

function remainingTasks(teamName) {

    const retentionDiv = document.querySelector(".js-retention-div");
    if(retentionDiv){
        retentionDiv.remove();
    }

    if (auctionData.retention.required) {

        const retentionDiv = document.createElement("div");
        retentionDiv.classList.add("js-retention-div");
        retentionDiv.style.display = "flex";
        retentionDiv.style.flexDirection = "column";
        retentionDiv.style.gap = "10px";
        retentionDiv.style.marginLeft = "30px";


        // HEADER
        const header = document.createElement("div");
        header.innerHTML = "Retention List";
        header.style.fontWeight = "bold";
        retentionDiv.appendChild(header);

        // ROW DIV → holds list + info side-by-side
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        rowDiv.style.gap = "10px";
        retentionDiv.appendChild(rowDiv);

        // LIST DIV
        const listDiv = document.createElement("div");
        listDiv.style.display = "flex";
        listDiv.style.flexWrap = "wrap";
        listDiv.style.height = "200px";
        listDiv.style.overflowY = "auto";
        listDiv.style.width = "220px";
        rowDiv.appendChild(listDiv);

        // INFORMATION DIV
        const informationDiv = document.createElement("div");
        informationDiv.classList.add("js-information-div");
        informationDiv.style.height = "200px";
        informationDiv.style.width = "265px";
        informationDiv.style.border = "1px solid black";
        rowDiv.appendChild(informationDiv);

        // Append to page
        document.querySelector(".js-content-div").appendChild(retentionDiv);


        // -------- Your existing player code --------
        console.log(teamName);
        teamName = String(teamName).toUpperCase();

        let playersList = cricPlayers[`${teamName}`];
        console.log(teamName, playersList);

        let list = `<ul style="list-style-type:none; padding:0; margin:0;">`;

        for (let i = 0; i < playersList.length; i++) {

            if(notSelectedPlayers.includes(playersList[i])){
                continue;
            }
            list += `<li>
                        <input class="player-check-box js-player-check-box" type="checkbox" data-player-name="${playersList[i]}"> ${playersList[i]}
                    </li>`;
        }

        list += "</ul>";

        listDiv.innerHTML = list;

        document.querySelectorAll(".js-player-check-box").forEach((element) =>{
            element.addEventListener("click" , ()=>{

                playerRetentionAmount = 0;

                if(element.checked){
                    playersRetentionList.push(element.dataset.playerName);
                }else{
                    
                    playersRetentionList = playersRetentionList.filter(p => p !== element.dataset.playerName);
                    
                }

                //limt check 
                let numberOfIndians = 0;
                let numberOfForiegners = 0;

                for(let i = 0 ; i < playersRetentionList.length ; i++){
                    const index = cricPlayers[`${teamName}`].indexOf(playersRetentionList[i]);
                    const nationality = nationalityList[`${teamName}`][index];
                    if(nationality == "i"){
                        numberOfIndians++;
                    }else{
                        numberOfForiegners++;
                    }
                    console.log(playersRetentionList[i] , nationalityList[`${teamName}`][index] , index);
                }
                if(numberOfIndians > auctionData.retention.indians){
                    alert(`Oops you can select only ${auctionData.retention.indians} indian players`);

                    console.log(numberOfIndians , auctionData.retention.indians);

                    element.checked = false;

                    playersRetentionList = playersRetentionList.filter(p => p !== element.dataset.playerName);

                    console.log(playersRetentionList);

                    return;
                    
                }
                if(numberOfForiegners > auctionData.retention.foreigners){
                    alert(`Oops you can select only ${auctionData.retention.foreigners} foreigner players`);


                    console.log(numberOfForiegners , auctionData.retention.foreigners);
                    element.checked = false;


                    playersRetentionList = playersRetentionList.filter(p => p !== element.dataset.playerName);

                    console.log(playersRetentionList);
                    return;
                }

                let list = `<ul style="list-style-type:none;">`;

                for(let i = 0 ; i < playersRetentionList.length ; i++){
                    if(i < 2){
                        list += `<li>${playersRetentionList[i]} ${18 -(6*i)}Cr</li>`;
                        playerRetentionAmount += 18 - (6*i);
                    }else{
                        list += `<li>${playersRetentionList[i]} 6Cr</li>`;
                        playerRetentionAmount += 6;
                    }
                }

                list += "</ul>" 

                const informationDiv = document.querySelector(".js-information-div");

                const amountDeductedDiv = document.createElement("div");
                amountDeductedDiv.classList.add("js-amount-deducted-div");
                const listDiv = document.createElement("div");
                listDiv.classList.add("js-retention-list-div");
                amountDeductedDiv.innerHTML = `Amount deducted will be : ${playerRetentionAmount}`;
                listDiv.innerHTML = list;

                if(document.querySelector(".js-amount-deducted-div")){
                    document.querySelector(".js-amount-deducted-div").remove();
                }
                if(document.querySelector(".js-retention-list-div")){
                    document.querySelector(".js-retention-list-div").remove();
                }
                informationDiv.appendChild(amountDeductedDiv);
                informationDiv.appendChild(listDiv);
  
                //informationDiv.innerHTML = list;
            })
        })
    }
    
}

async function retentionDataToDb(playerRetentionList , playerRetentionAmount , teamName){
    //console.log(auctionData.purseAmount , typeof(auctionData.purseAmount) , playerRetentionList , playerRetentionAmount , teamName);
    const dataObject = {
        playerRetentionList,
        amountAvailable : (auctionData.purseAmount - playerRetentionAmount),
    }
    await set(ref(db , `${auctionData.auctionCode}/${teamName}`) , dataObject);
}



onValue(ref(db , `${auctionData.auctionCode}/playersJoined`) ,(snapshot)=>{
    if(snapshot.exists()){
        const playersJoinedList = Object.values(snapshot.val());
        console.log(playersJoinedList);
        updatePlayersList(playersJoinedList);
        removeTeam(playersJoinedList);
    }
})

onValue(ref(db , `${auctionData.auctionCode}/auctionStarted`) ,(snapshot)=>{
    if(snapshot.exists()){
        if(snapshot.val() === true){
            window.open("auction-room.html" , "_blank");
        }
    }
})


console.log(localStorage.getItem("auction-data"))