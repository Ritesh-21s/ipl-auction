import { cricPlayers  , findNationality} from "./players-list.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set ,push ,onValue ,get} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";



const firebaseConfig = {
databaseURL: "https://auction-app-ipl-6099d-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auctionCode = JSON.parse(localStorage.getItem("auction-data")).auctionCode;
const teamName = JSON.parse(localStorage.getItem("auction-data")).myName;
const maxSquadSize = JSON.parse(localStorage.getItem('auction-data')).squadSize;
const maxForeignPlayers = JSON.parse(localStorage.getItem('auction-data')).maxForeignPlayers;
const auctioneer = localStorage.getItem("auctioneer");
const showMyTeamBtn = document.querySelector(".js-show-my-team");
const myTeamDiv = document.querySelector(".js-my-team-content");
let yourSquadSize = 0;
let yourForeignPlayers = 0;
let auctionTimer = null;
let purseAmount;
let bidController = false;
let bidHolder = null;
let playersRetentionList = [];
let notSelectedPlayers = [];
let currentPlayerNationality;
await getNotSelectedPlayers();  
await getPurseAmount(teamName);
await getRetentionList();

yourSquadSize += playersRetentionList.length;
for(const playerName in playersRetentionList){
    const nationality = findNationality(playerName , teamName);
    if(nationality == 'f'){
        yourForeignPlayers++;
    }
}

if(auctioneer == "true"){
    const setBasePrice = document.createElement("button");
    setBasePrice.classList.add("btn");
    setBasePrice.classList.add("base");
    setBasePrice.innerHTML = 'Set Base Price'
    document.querySelector(".js-auction-buttons").appendChild(setBasePrice);


    const skipPlayer = document.createElement("button");
    skipPlayer.classList.add("btn");
    skipPlayer.classList.add('skip');
    skipPlayer.innerHTML = 'Skip Player';
    document.querySelector(".js-auction-buttons").appendChild(skipPlayer);

    skipPlayer.addEventListener('click' , async ()=>{
        await set(ref(db , `${auctionCode}/currentBid/unsold`) , true);
    })

    setBasePrice.addEventListener("click" , ()=>{
        document.querySelector(".js-player-base").innerHTML = 'Base Price : ₹ <input class="js-base-price" style="width:30px; height:15px;"> Cr';

        document.querySelector(".js-base-price").addEventListener("keydown" , (event)=>{
            if(event.key === "Enter")
            {
                setBasePriceFunc();
                
            }
        });
    });

}

async function fetchPlayerImage(playerName , teamName) {
    const imgElement = document.querySelector(".js-player-photo");

    // Local image path (image name = player name)
    const imagePath = `CricketPlayers/${encodeURIComponent(playerName)}.jpg`;

    const img = new Image();
    img.src = imagePath;

    img.onload = () => {
        imgElement.src = imagePath;
    };

    img.onerror = () => {
        imgElement.src = "images/default-image.jpg";
    };

    const currentBid ={
        playerName : playerName,
        teamName : teamName,
        currentPrice : 0,
        currentBidHolder: "none",
        biddingStarted : 0,
        basePrice: 0,
        auctionEndTime : null,
        sold: false,
        unsold:false
    }

    await set(ref(db , `${auctionCode}/currentBid`) , currentBid);

    currentPlayerNationality = findNationality(playerName , teamName);
}

async function getRetentionList(){
    const snapshot = await get(ref(db , `${auctionCode}/playersJoined`));
    let teamNames;
    if(snapshot.exists()){
        teamNames = Object.values(snapshot.val());
    }

    for(const teamName of teamNames){
        const snapshot = await get(ref(db , `${auctionCode}/${teamName}/playerRetentionList`));
        if(snapshot.exists()){
            playersRetentionList.push(...Object.values(snapshot.val()));
        }
    }

}


const teamNames = Object.keys(cricPlayers);
let teamNumber = 0;
let playerNumber = 0;
function findPlayer(){
    
    while (teamNumber < teamNames.length) {
    const team = teamNames[teamNumber];
    const players = cricPlayers[team];

    if (playerNumber >= players.length) {
      teamNumber++;
      playerNumber = 0;
      continue;
    }

    const playerName = players[playerNumber];
    playerNumber++;

    if (playersRetentionList.includes(playerName)||notSelectedPlayers.includes(playerName)) {
      continue; 
    }

    document.querySelector(".js-player-name").innerHTML = playerName;
    fetchPlayerImage(playerName, team);
    return;
    }

    console.log("Auction ended successfully");
    endAuctionAndShowSquads();
}
findPlayer();

document.querySelector(".js-raise-bid").addEventListener("click" , ()=>{
    console.log('bidController value'+bidController);
    if(!bidController){
        showNotify("Please wait for the auctionner to set the base price");
        return;
    }

    if(bidHolder === teamName.toUpperCase()){
        showNotify("You hold the current bid so can't raise the bid");
        return;
    }

    if(yourSquadSize >= maxSquadSize){
        showNotify(`OOPS ! your can only have ${maxSquadSize} players in your team.Your current squad size`+yourSquadSize);
        return;
    }

    if(currentPlayerNationality === "f" &&yourForeignPlayers >= maxForeignPlayers){
        showNotify(`OOPS ! your can only have ${maxForeignPlayers} foreign players in your team.Your current squad has ${yourForeignPlayers} foreign players`);
        return;
    }

    let currentBid = raiseBid(teamName);
    const suffix = (currentBid >= 1)?"Cr":"Lakhs";
    currentBid = (currentBid >= 1)?currentBid:currentBid*100;
    
    let currentBidElement = document.querySelector(".js-current-bid");
    if(!currentBidElement){
        currentBidElement = document.createElement("p");
        currentBidElement.classList.add("js-current-bid");
        currentBidElement.innerHTML = `Current Price : ₹ ${currentBid} ${suffix}`;
        document.querySelector(".js-player-info").appendChild(currentBidElement);

    }
    else{
        currentBidElement.innerHTML = `Current Price : ₹ ${currentBid} ${suffix}`;
        
    }
   
})

async function getNotSelectedPlayers(){
    const snapshot = await get(ref(db , `${auctionCode}/notSelectedPlayers`));
    if(snapshot.exists()){
        notSelectedPlayers.push(...Object.values(snapshot.val()));
    }
}

showMyTeamBtn.addEventListener("click", showMyTeam);

async function showMyTeam() {
  myTeamDiv.innerHTML = "";

  // Close button
  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "✕";
  closeBtn.classList.add("my-team-close");
  closeBtn.onclick = () => (myTeamDiv.style.display = "none");

  // Title
  const title = document.createElement("h3");
  title.innerText = `${teamName} Squad`;

  // Purse display
  const purseEl = document.createElement("p");
  purseEl.classList.add("js-purse-amount");

  const purseSnap = await get(
    ref(db, `${auctionCode}/${teamName}/amountAvailable`)
  );

  const purse = purseSnap.exists() ? purseSnap.val() : 0;
  purseEl.innerText = `Remaining Purse: ₹ ${purse} Cr`;

  myTeamDiv.append(closeBtn, title, purseEl);

  // Player list
  const list = document.createElement("ul");

  const snap = await get(
    ref(db, `${auctionCode}/${teamName}/playerRetentionList`)
  );

  if (!snap.exists()) {
    const empty = document.createElement("p");
    empty.innerText = "No players bought yet";
    myTeamDiv.appendChild(empty);
  } else {
    snap.forEach(child => {
      const val = child.val();
      const li = document.createElement("li");
      li.innerText = val.playerName ?? val;
      list.appendChild(li);
    });

    myTeamDiv.appendChild(list);
  }

  myTeamDiv.style.display = "block";
}


async function setBasePriceFunc(){
    const value = Number(document.querySelector(".js-base-price").value);
    
    await set(ref(db , `${auctionCode}/currentBid/basePrice`) , value);

    await set(ref(db , `${auctionCode}/currentBid/currentPrice`) , value);
}

async function endAuctionAndShowSquads() {
  document.body.innerHTML = `
    <div class="auction-finale">
      <h1 class="final-title">🏏 Auction Completed</h1>
      <p class="final-subtitle">Final Team Squads</p>
      <div class="final-squads"></div>
    </div>
  `;

  const container = document.querySelector(".final-squads");

  const teamsSnap = await get(ref(db, `${auctionCode}/playersJoined`));
  if (!teamsSnap.exists()) return;

  const teams = Object.values(teamsSnap.val());

  for (const team of teams) {
    if(team == true){
        continue;
    }
    const teamCard = document.createElement("div");
    teamCard.classList.add("team-card");

    const title = document.createElement("h3");
    title.innerText = team;

    const purseSnap = await get(
      ref(db, `${auctionCode}/${team}/amountAvailable`)
    );
    const purse = purseSnap.exists() ? purseSnap.val() : 0;

    const purseEl = document.createElement("p");
    purseEl.innerText = `Remaining Purse: ₹ ${purse} Cr`;

    const list = document.createElement("ul");

    const playersSnap = await get(
      ref(db, `${auctionCode}/${team}/playerRetentionList`)
    );

    if (playersSnap.exists()) {
      playersSnap.forEach(child => {
        const li = document.createElement("li");
        li.innerText = child.val().playerName ?? child.val();
        list.appendChild(li);
      });
    } else {
      const empty = document.createElement("p");
      empty.classList.add("empty");
      empty.innerText = "No players bought";
      teamCard.appendChild(empty);
    }

    teamCard.append(title, purseEl, list);
    container.appendChild(teamCard);
  }
}

async function raiseBid(currentBidHolder){
    
    currentBidHolder = String(currentBidHolder).toUpperCase();
    const snapshot = await get(ref(db , `${auctionCode}/currentBid/currentPrice`));
    let currentBid = 0;
    if(snapshot.exists()){
        currentBid = Number(snapshot.val());
    }

    if(purseAmount < currentBid + 0.25){
        alert("OOPS ! you don't have sufficient funds .You current purse amount "+purseAmount);
        return;
    }
    await set(ref(db , `${auctionCode}/currentBid/currentPrice`) , currentBid + 0.25);

    if(document.querySelector(".js-current-bit-holder-div")){
        document.querySelector(".js-current-bit-holder-div").remove();
    }

    const currentBitHolderDiv = document.createElement("p");
    currentBitHolderDiv.classList.add("js-current-bit-holder-div");
    currentBitHolderDiv.innerHTML = `Current Bit Holder : ${currentBidHolder}`;
    document.querySelector(".js-player-info").appendChild(currentBitHolderDiv);

    await set(ref(db , `${auctionCode}/currentBid/currentBidHolder`) , currentBidHolder);

    await set(ref(db , `${auctionCode}/currentBid/auctionEndTime`),Date.now() + 6000);

    return currentBid + 0.25;

}

async function getPurseAmount(teamName){
    const snapshot = await get(ref(db , `${auctionCode}/${teamName}/amountAvailable`));
    if(snapshot.exists()){
        purseAmount = Number(snapshot.val());
    }
}

async function handleSold() {
  const bidSnap = await get(ref(db, `${auctionCode}/currentBid`));
  if (!bidSnap.exists()) return;

  const bid = bidSnap.val();

  if (bid.currentBidHolder === "none") return;

  if (bid.currentBidHolder === teamName.toUpperCase()) {
    purseAmount -= bid.currentPrice;
    await set(
      ref(db, `${auctionCode}/${teamName}/amountAvailable`),
      purseAmount
    );
    await push(
        ref(db, `${auctionCode}/${teamName}/playerRetentionList`),
        bid.playerName
    );

    yourSquadSize += 1;
    const nationality = findNationality(bid.playerName , bid.teamName);
    if(nationality === "f"){
        yourForeignPlayers += 1;
    }

  }

  const soldData = {
    playerName: bid.playerName,
    soldTo: bid.currentBidHolder,
    soldPrice: bid.currentPrice
  };

  await push(ref(db, `${auctionCode}/soldPlayers`), soldData);
  
}

function showNotify(message) {
  const notify = document.getElementById("notify");

  notify.classList.add("show");
  notify.innerText = message;

  setTimeout(() => {
    notify.classList.remove("show");
  }, 3000); // disappears after 3 sec
}



onValue(ref(db , `${auctionCode}/currentBid/basePrice`) ,(snapshot)=>{
    if(snapshot.exists()){
        const basePrice = Number(snapshot.val());
        if(basePrice > 0 && basePrice > 1){
            document.querySelector(".js-player-base").innerHTML = `Base Price: ₹ ${basePrice} Cr`;
        }else if(basePrice > 0 && basePrice < 1){
            document.querySelector(".js-player-base").innerHTML = `Base Price: ₹ ${basePrice*100} Lakhs
            `;
        }else{
            document.querySelector(".js-player-base").innerHTML = `Base Price: ₹ 2 Cr`;
        }

        if(basePrice > 0){
            bidController = true;
        }
    }
})


onValue(ref(db , `${auctionCode}/currentBid/currentPrice`) ,(snapshot)=>{
    if(snapshot.exists()){
        let currentBid = Number(snapshot.val());
        const suffix = (currentBid >= 1)?"Cr":"Lakhs";
        currentBid = (currentBid >= 1)?currentBid:currentBid*100;
        
        let currentBidElement = document.querySelector(".js-current-bid");
        if(!currentBidElement){
            currentBidElement = document.createElement("p");
            currentBidElement.classList.add("js-current-bid");
            currentBidElement.innerHTML = `Current Price : ₹ ${currentBid} ${suffix}`;
            document.querySelector(".js-player-info").appendChild(currentBidElement);
        }
        else{
            currentBidElement.innerHTML = `Current Price : ₹ ${currentBid} ${suffix}`;
        }
    }
})

onValue(ref(db , `${auctionCode}/currentBid/currentBidHolder`),(snapshot)=>{
    if(snapshot.exists()){
        const currentBidHolder = snapshot.val();
        bidHolder = currentBidHolder;
        if(!document.querySelector(".js-current-bit-holder-div")){
            const currentBitHolderDiv = document.createElement("p");
            currentBitHolderDiv.classList.add("js-current-bit-holder-div");
            currentBitHolderDiv.innerHTML = `Current Bit Holder : ${currentBidHolder}`;
            document.querySelector(".js-player-info").appendChild(currentBitHolderDiv);

        }
        if(document.querySelector(".js-current-bit-holder-div")){
        
            const currentBitHolderDiv = document.querySelector(".js-current-bit-holder-div");
            currentBitHolderDiv.innerHTML = `Current Bit Holder : ${currentBidHolder}`;
        }    
    }
})


onValue(ref(db, `${auctionCode}/currentBid/auctionEndTime`), (snapshot) => {
  if (!snapshot.exists()) return;

  const endTime = snapshot.val();

  clearInterval(auctionTimer);

  auctionTimer = setInterval(async() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);

    const status = document.querySelector(".auction-status");
    const bar = document.querySelector(".timer-bar");

    document.querySelector('.auction-timer').classList.remove('hidden');
    status.classList.remove('hidden');

    if (remaining <= 0) {
      clearInterval(auctionTimer);
      status.innerText = "SOLD!";
      bar.style.width = "0%";
      const bidSnap = await get(ref(db, `${auctionCode}/currentBid`));
        const bid = bidSnap.val();

        if (!bid.sold) {
            await handleSold();

            // mark player as sold
            await set(ref(db, `${auctionCode}/currentBid/sold`), true);

            document.querySelector('.auction-timer').classList.add('hidden');
            status.classList.add('hidden');
            bidController = false;

            findPlayer();
        }
        return;
    }

    bar.style.width = `${(remaining / 6) * 100}%`;

    if (remaining === 3) status.innerText = "Going once...";
    else if (remaining === 2) status.innerText = "Going twice...";
    else if (remaining === 1) status.innerText = "Going thrice...";
    else status.innerText = "";
  }, 200);
});

onValue(ref(db, `${auctionCode}/${teamName}/amountAvailable`), (snapshot) => {
  if (snapshot.exists()) {
    purseAmount = Number(snapshot.val());
  }
});
onValue(ref(db , `${auctionCode}/currentBid/unsold`) , (snapshot)=>{
    if(snapshot.exists()){
        if(snapshot.val() == true){
            showNotify("Player UNSOLD!!!");
            findPlayer();
        }
    }
})


console.log(localStorage.getItem("auction-data"))
