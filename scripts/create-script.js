import { cricPlayers } from "./players-list.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set , push} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
databaseURL: "https://auction-app-ipl-6099d-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const teamNames = Object.keys(cricPlayers);

let selectedPlayersCount = {}
let total = 0
let totalSelectedPlayers = 0;
let notSelectedPlayers = [];

const retentionYesButton = document.querySelector(".js-retention-yes-button");

const retentionNoButton = document.querySelector(".js-retention-no-button");

const retentionDiv = document.querySelector(".js-retention-div");

// Container for dynamic fields


let retentionFieldsContainer = null;

teamNames.forEach((teamName)=>{
    selectedPlayersCount[teamName] = 0

    total += cricPlayers[teamName].length;
})

//console.log(total , selectedPlayersCount);


const viewPlayersBtn = document.querySelector(".js-view-players-button");
const contentDiv = document.querySelector(".js-list-container");

viewPlayersBtn.addEventListener("click", () => {
    

    let inner_html = `<h2 style="margin-left:10px;"> Players List</h2><div class="team-container">`;

    teamNames.forEach((teamName)=>{
        let player_obj = cricPlayers[teamName];

        inner_html +=`<div class="team"><p style="margin-left:20px;">${teamName}</p>`;

        inner_html += `<ul class="players-list">`;

        player_obj.forEach((cricPlayer) => {
            inner_html += `<li>${cricPlayer}</li>`;
        });

        inner_html += `</ul></div>`;


    })

    inner_html += '</div>';
    contentDiv.innerHTML = inner_html;


    contentDiv.innerHTML += `<button class="exit-button js-exit-button">x</button>`;

    const exitButton = document.querySelector(".js-exit-button");

    exitButton.addEventListener("click" , ()=>{
        contentDiv.innerHTML = "";
        viewPlayersBtn.checked = false;
    })

});


const editPlayerButton = document.querySelector(".js-edit-players-button")

editPlayerButton.addEventListener("click" , ()=>{
    let inner_html = `
        <h2>Players List</h2>
        <p><input type = "checkbox" class="js-select-all-players">Select All</p><div class="team-container">
    `;

    teamNames.forEach((teamName)=>{
        inner_html += team_provider(teamName);
    })
    
    inner_html += `</div><div class="button-container">
    <button class="save-button js-save-button">Save</button>
    </div>`;

    contentDiv.innerHTML = inner_html;

    contentDiv.innerHTML += `<button class="exit-button js-exit-button">x</button>`;

    const exitButton = document.querySelector(".js-exit-button");

    exitButton.addEventListener("click" , ()=>{
        contentDiv.innerHTML = "";
        //editPlayerButton.checked = false;
    })

    const selectAllPlayersButton = document.querySelector(".js-select-all-players");

    selectAllPlayersButton.addEventListener("click" , ()=>{
        
        if(selectAllPlayersButton.checked){
            checkAll();
        }
        else{
            uncheckAll();
        }

    })

    document.querySelectorAll(".js-select-team-players").forEach((element)=>{
        element.addEventListener("click" , ()=>{
            const teamName = element.dataset.teamName
            if(element.checked){
                checkAllTeamPlayers(teamName)

                totalSelectedPlayers += (cricPlayers[teamName].length)

                selectedPlayersCount[teamName] += (cricPlayers[teamName].length)
            }
            else{
                uncheckAllTeamPlayers(teamName)

                totalSelectedPlayers -= (cricPlayers[teamName].length)

                selectedPlayersCount[teamName] = 0
            }

            updateSelectAllAndPlayersButton(teamName);
        })
    })

    document.querySelectorAll(".js-player-checkbox").forEach((element)=>{
        element.addEventListener("click" , ()=>{
            if(element.checked){
                selectedPlayersCount[`${element.dataset.teamName}`] += 1;

                totalSelectedPlayers += 1

                
            }
            else{
                selectedPlayersCount[`${element.dataset.teamName}`] -= 1;

                totalSelectedPlayers -= 1;
            }

            updateSelectAllAndPlayersButton(element.dataset.teamName)
        })
    })

    document.querySelector(".js-save-button").addEventListener("click" , ()=>{
        notSelectedPlayers = []
        document.querySelectorAll(".js-player-checkbox").forEach((element)=>{
            if(element.checked == false){
                notSelectedPlayers.push(element.dataset.playerName);
            }
        })

        //console.log(notSelectedPlayers);
        console.log(notSelectedPlayers);
        alert("Your player list has been updated");
    })

})

retentionYesButton.addEventListener("click", () => {
    
    if (!retentionFieldsContainer) {
        retentionFieldsContainer = document.createElement("div");
        

        retentionFieldsContainer.innerHTML = `
            <input type="number" class ="auction-code-input-field js-retention-indian" placeholder="Enter the number of Indian players" 
                   style="width:280px;margin-bottom: 10px;margin-top:10px; display:block;">
            <input type="number" class ="auction-code-input-field js-retention-foriegn" placeholder="Enter the number of Foreign players" 
                   style="width:280px; display:block;">
        `;
        retentionDiv.appendChild(retentionFieldsContainer);
    }
});

retentionNoButton.addEventListener("click", () => {

    if (retentionFieldsContainer) {
        retentionDiv.removeChild(retentionFieldsContainer);
        retentionFieldsContainer = null;
    }
});

const maximumForiegnPlayers = returnHtmlObject("js-maximum-foriegn-players")

maximumForiegnPlayers.addEventListener("input" , ()=>{
    let maximum = Number(maximumForiegnPlayers.value)

    const divForForiegns = returnHtmlObject("js-div-for-foriegns")

    divForForiegns.innerHTML = ""

    if(maximum > Number((returnHtmlObject("js-squad-size")).value)){
        divForForiegns.innerHTML = "* Number of foreign players is greater than the  squad size";
    }

    
})

const goToButton = returnHtmlObject("js-go-to-button")

goToButton.addEventListener("click" , ()=>{
    validationFunction();
    
})


function team_provider(teamName){

    let inner_html = `<div class = "team"><span style="margin-left:10px;"><input type="checkbox" class="js-select-team-players" data-team-name = "${teamName}">${teamName}</span>`;

    inner_html += `<ul class="edit-players-list">`;

    let player_obj = cricPlayers[teamName];

    player_obj.forEach((cricPlayer) => {
        inner_html += `<li><input type = "checkbox" class="js-player-checkbox ${teamName}" data-player-name = "${cricPlayer}" data-team-name = "${teamName}">${cricPlayer}</li>`;
    });

    inner_html += `</ul></div>`;

    return inner_html;
}

function checkAll(){
    document.querySelectorAll(".js-select-team-players").forEach((element)=>{
        element.checked = true;
        checkAllTeamPlayers(element.dataset.teamName);
        selectedPlayersCount[element.dataset.teamName] += (cricPlayers[element.dataset.teamName].length)
    })

    totalSelectedPlayers = total;
}

function uncheckAll(){
    document.querySelectorAll(".js-select-team-players").forEach((element)=>{
        element.checked = false;
        uncheckAllTeamPlayers(element.dataset.teamName);

        selectedPlayersCount[element.dataset.teamName] = 0;
    })

    totalSelectedPlayers = 0;
}

function checkAllTeamPlayers(teamName){
    document.querySelectorAll(`.${teamName}`).forEach((element)=>{
        element.checked = true;
    })
}

function uncheckAllTeamPlayers(teamName){
    document.querySelectorAll(`.${teamName}`).forEach((element)=>{
        element.checked = false;
    })
}

function updateSelectAllAndPlayersButton(teamName){
    console.log(teamName)
    const selectAllPlayersButton = document.querySelector(".js-select-all-players");
    if(totalSelectedPlayers !== total){
        selectAllPlayersButton.checked = false;
    }
    else{
        selectAllPlayersButton.checked = true;
    }

    if(selectedPlayersCount[teamName] !== cricPlayers[teamName].length){
        document.querySelector(`.js-select-team-players[data-team-name="${teamName}"]`).checked = false;
    }
    else{
        document.querySelector(`.js-select-team-players[data-team-name="${teamName}"]`).checked = true;
    }

    //console.log(total , totalSelectedPlayers , selectedPlayersCount[teamName] )
    
}

function returnHtmlObject(className){
    return document.querySelector(`.${className}`);
}

function validationFunction(){

    document.querySelectorAll(".warning-class").forEach(
        (element)=>{
            element.innerHTML = "";
        }
    )

    let isValid = true;

    if(!auctionCodeValidation())
        isValid = false;
    if(!squadSizeValidation()) 
        isValid = false;
    if(!foriegnPlayersValidation()) 
        isValid = false;
    if(!purseAmountValidation()) 
        isValid = false;
    if(!retentionValidation()) 
        isValid = false;
    if(!playersListValidation()) 
        isValid = false;

    

    if(isValid)
    {
        saveAuctionData();
        window.open("participate.html", "_blank");

    }

}

function auctionCodeValidation(){

    let isValid = true;

    const inputAuctionCodeField = returnHtmlObject("js-auction-code-input-field");

    const warningDiv = returnHtmlObject("js-div-for-auction-code");

    if(inputAuctionCodeField.value == ""){
        
        warningDiv.innerHTML = "please enter a code for your auction";

        isValid = false;

    }

    if((inputAuctionCodeField.value).length < 6){

        warningDiv.innerHTML = "please enter a code of length 6 characters";
        isValid = false;
    }

    return isValid;
}

function squadSizeValidation(){
    let isValid = true;
    const squadSizeObject = returnHtmlObject("js-squad-size");

    const squadSize = Number(squadSizeObject.value)

    const warningDiv = returnHtmlObject("js-div-for-squad-size");

    if(squadSize == 0){
        warningDiv.innerHTML = "OOPS! squad size must be greater than or equal to 11";

        isValid = false;
    }
    else if(squadSize < 11){
        warningDiv.innerHTML = "Enter the squad size which must be greater than 11";

        isValid = false;
    }

    return isValid;
}

function foriegnPlayersValidation(){
    let isValid = true;
    const foriegnPlayersObject = returnHtmlObject("js-maximum-foriegn-players")

    const foriegnPlayers = Number(foriegnPlayersObject.value);

    const warningDiv = returnHtmlObject("js-div-for-foriegns");

    if(foriegnPlayers <= 0){
        warningDiv.innerHTML = "Enter the maximum number of foriegn players preferabley less then or equal to 8";

        isValid = false;
    }

    return isValid;
}

function purseAmountValidation(){
    let isValid = true;

    const purseAmountObject = returnHtmlObject("js-purse-amount-input-field");

    const purseAmount = Number(
        purseAmountObject.value
    )

    const warningDiv = returnHtmlObject("js-div-for-purse-amount")
    if(purseAmount <= 0){
        warningDiv.innerHTML = "Enter the purse amount in crores";

        isValid = false;

    }

    if(purseAmount < 20){
        warningDiv.innerHTML = "Purse amount must be greater than or equal to 20 crores";

        isValid = false;
    }

    return isValid;
}

function retentionValidation(){
    let ischecked = false;

    let isValid = true;

     document.querySelectorAll(".js-retention-button").forEach(
        (element)=>{
            if(element.checked){
                ischecked = true;
            }
        }
     )

     const warningDiv = returnHtmlObject("js-div-for-retention")
     if(!ischecked){
        warningDiv.innerHTML = "Select yes or no"
        isValid = false;
     }

     const retentionYesButton = returnHtmlObject("js-retention-yes-button");

     if(retentionYesButton.checked){
        isValid = retentionYesButtonValidation(warningDiv , isValid);
     }
     return isValid;
}

function retentionYesButtonValidation(warningDiv , isValid){
    const retentionIndians = Number(
        (returnHtmlObject("js-retention-indian")).value
    )

    const retentionForiegn = Number(
        (returnHtmlObject("js-retention-foriegn")).value
    )

    if(retentionIndians <= 0 && retentionForiegn <= 0){
        warningDiv.innerHTML = "Enter the number of indians and foriegners";
        isValid = false;
    }else if(retentionIndians <= 0){
        warningDiv.innerHTML = "Enter the number of indians";
        isValid = false;
    }
    else if(retentionForiegn <= 0){
        warningDiv.innerHTML = "Enter the number of foriegners";
        isValid = false;
    }

    return isValid;
}

function playersListValidation(){
    let isChecked = false;
    let isValid = true;
    const warningDiv = returnHtmlObject("js-div-for-players-list")

    document.querySelectorAll(".js-players-list").forEach(
        (element)=>{
            if(element.checked){
                isChecked = true;
            }
        }
    )

    if(!(isChecked)){
        warningDiv.innerHTML = "Use default players list or create your own"

        isValid = false;
    }

    return isValid;
}

async function saveAuctionData() {
    const auctionCode = returnHtmlObject("js-auction-code-input-field").value.trim();
    const squadSize = Number(returnHtmlObject("js-squad-size").value);
    const foreignPlayers = Number(returnHtmlObject("js-maximum-foriegn-players").value);
    const purseAmount = Number(returnHtmlObject("js-purse-amount-input-field").value);

    let retentionRequired = returnHtmlObject("js-retention-yes-button").checked;
    let retentionIndians = null;
    let retentionForeign = null;
    if (retentionRequired) {
        const indianInput = returnHtmlObject("js-retention-indian");
        const foreignInput = returnHtmlObject("js-retention-foriegn");
        if (indianInput && foreignInput) {
        retentionIndians = Number(indianInput.value);
        retentionForeign = Number(foreignInput.value);
        }
    }

    const auctionData = {
        auctionCode: auctionCode,
        squadSize: squadSize,
        maxForeignPlayers: foreignPlayers,
        purseAmount: purseAmount,
        retention: {
        required: retentionRequired,
        indians: retentionIndians,
        foreigners: retentionForeign
        },
        notSelectedPlayers: notSelectedPlayers,
        playersJoined :{
            placeholder: true
        },
        auctionStarted : false
    };

    await set(ref(db, auctionCode), auctionData);
    await push(ref(db , 'auction-codes') , auctionCode);

    localStorage.setItem("data" , JSON.stringify(auctionData));
    localStorage.setItem("auctioneer" , "true");

    alert("Auction room created & saved successfully ✅");
}













