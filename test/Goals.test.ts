import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Goals", function () {

  describe("GoalsToken", function () {
    async function deployFixture() {
      const [owner, otherAccount] = await ethers.getSigners();
      const GoalsToken = await ethers.getContractFactory("GoalsToken");
      const goalsToken = await GoalsToken.deploy();
      return { goalsToken, owner, otherAccount };
    }
    
    it("Should deploy the GoalsToken", async function () {
      const { goalsToken } = await loadFixture(deployFixture);
      expect(await goalsToken.name()).to.equal("GoalsToken");
    });

    it("Should set the right owner", async function () {
      const { goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      expect(await goalsToken.owner()).to.equal(owner.address);
    });

    it("Should mint 1000 tokens to the owner", async function () {
      const { goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await goalsToken.mint(owner.address, 1000);
      expect(await goalsToken.balanceOf(owner.address)).to.equal(1000);
    });

    it("Should mint 1000 tokens to the otherAccount", async function () {
      const { goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await goalsToken.mint(otherAccount.address, 1000);
      expect(await goalsToken.balanceOf(otherAccount.address)).to.equal(1000);
    });

    it("Should transfer 100 tokens from owner to otherAccount", async function () {
      const { goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await goalsToken.mint(owner.address, 1000);
      await goalsToken.transfer(otherAccount.address, 100);
      expect(await goalsToken.balanceOf(owner.address)).to.equal(900);
      expect(await goalsToken.balanceOf(otherAccount.address)).to.equal(100);
    });

    it("Should burn 100 tokens from owner", async function () {
      const { goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await goalsToken.mint(owner.address, 1000);
      await goalsToken.burn(100);
      expect(await goalsToken.balanceOf(owner.address)).to.equal(900);
    });

  });

  describe("GoalsContract", function () {
    async function deployFixture() {
      const [owner, otherAccount] = await ethers.getSigners();
      const GoalsToken = await ethers.getContractFactory("GoalsToken");
      const goalsToken = await GoalsToken.deploy();
      const addr = await goalsToken.getAddress();
      const Goals = await ethers.getContractFactory("Goals");
      const goals = await Goals.deploy(addr);
      return { goals, goalsToken, owner, otherAccount };
    }

    it("Should deploy the GoalsContract", async function () {
      const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      expect(await goals.getAddress()).not.to.be.undefined;
    });

    it("Should set the right owner", async function () {
      const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      expect(await goals.owner()).to.equal(owner.address);
    });

    it("Should set the right token", async function () {
      const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      const addr = await goals.token();
      expect(addr).to.equal(await goalsToken.getAddress());
    });

    it("Should create a goal", async function () {
      const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await goalsToken.mint(owner.address, 1000);
      await goalsToken.approve(goals.getAddress(), 1000);
      await goals.createGoal("Test Name", "Test Description", "Test Category", "Teste Frequency Type", 100, 1000, 10000, 100000, true, 100, 10000000, ["blablabla"], "km", 10, 1000);
      const goal = await goals.getGoal();
      expect(goal[0].name).to.equal("Test Name");
    });

    it("Should not create a goal if the user has less tokens than pre-funded", async function () {
      const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
      await expect(goals.createGoal(
        "Test Name", 
        "Test Description", 
        "Test Category", 
        "Teste Frequency Type", 
        2, 
        10, 
        10000, 
        100000, 
        true, 
        100, 
        10000000, 
        ["blablabla"], 
        "km", 
        10, 
        1000
      )).to.be.revertedWith("Insufficient funds");
      
    });

    describe("Interaction with a Goal", function () {
      async function deployFixture() {
        // Getting the accounts
        const [owner, otherAccount, thirdAccount, fourthAccount, fithAcount, sixthAccount] = await ethers.getSigners();
        
        // Deploying the contracts
        const GoalsToken = await ethers.getContractFactory("GoalsToken");
        const goalsToken = await GoalsToken.deploy();
        const addr = await goalsToken.getAddress();
        const Goals = await ethers.getContractFactory("Goals");
        const goals = await Goals.deploy(addr);

        // Minting tokens to the accounts
        goalsToken.connect(owner);
        await goalsToken.mint(owner.address, 100000000000);
        await goalsToken.mint(otherAccount.address, 10000000000);
        await goalsToken.mint(thirdAccount.address, 10000000000);
        await goalsToken.mint(fourthAccount.address, 10000000000);
        await goalsToken.mint(fithAcount.address, 10000000000);
        await goalsToken.mint(sixthAccount.address, 10000000000);
        
        // Approving the contract to spend the tokens
        await goalsToken.approve(await goals.getAddress(), 1000000000);
        await goalsToken.connect(otherAccount).approve(await goals.getAddress(), 10000000);
        await goalsToken.connect(thirdAccount).approve(await goals.getAddress(), 10000000);
        await goalsToken.connect(fourthAccount).approve(await goals.getAddress(), 10000000);
        await goalsToken.connect(fithAcount).approve(await goals.getAddress(), 10000000);
        await goalsToken.connect(sixthAccount).approve(await goals.getAddress(), 10000000);
        
        // Creating a goal
        goalsToken.connect(owner);
        await goals.createGoal("Test Name", "Test Description", "Test Category", "Teste Frequency Type", 3, 10, 1000, 100000, true, 100, 10000000, ["blablabla"], "km", 10, 1000);

        return { goals, goalsToken, owner, otherAccount, thirdAccount, fourthAccount, fithAcount, sixthAccount};
      }

      it("Should let otherAccount participate in the goal", async function () {
        const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
        await goals.connect(otherAccount).enterGoal(0, 10000);
        const enteredGoals = await goals.connect(otherAccount).getMyEnteredGoals();
        const myBets = await goals.connect(otherAccount).getMyBets(0);
        expect(enteredGoals[0]).to.equal(0);
        expect(myBets).to.equal(10000);
      });

      it("Should not let creator start the goal with 0 participants", async function () {
        const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
        await expect(goals.startGoal(0)).to.be.revertedWith("No participants in this goal");
      });

      it("Should let creator start and finish the goal with no winnig participant", async function () {
        const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
        const initBalance = await goalsToken.balanceOf(owner.address);
        const initOtherBalance = await goalsToken.balanceOf(otherAccount.address);
        await goals.connect(otherAccount).enterGoal(0, 10000);
        await goals.connect(owner).startGoal(0);
        await goals.completeGoal(0);
        const goal = await goals.getGoal();
        const finalBalance = await goalsToken.balanceOf(owner.address);
        expect(goal[0].isCompleted).to.equal(true);
        expect(finalBalance).to.be.greaterThan(initBalance);
      });

      it("Should let user to update it's progress", async function () {
        const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
        await goals.connect(otherAccount).enterGoal(0, 10000);
        await goals.startGoal(0);
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste");
        const myUris = await goals.getParticipantsUri(0, otherAccount.address);
        expect(myUris[0]).to.equal("Imagem teste");
      });

      it("Should complete the goal with a premiated participant", async function () {
        const { goals, goalsToken, owner, otherAccount } = await loadFixture(deployFixture);
        const initBalance = await goalsToken.balanceOf(otherAccount.address);

        await goals.connect(otherAccount).enterGoal(0, 1000);
        
        await goals.connect(owner).startGoal(0);
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 2");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 3");
        await goals.connect(owner).autenticateFrequency(0, otherAccount.address, 3, [0, 1, 2])

        const inGoalBalance = await goalsToken.balanceOf(otherAccount.address);
        await goals.connect(owner).completeGoal(0);
        
        const finalBalance = await goalsToken.balanceOf(otherAccount.address);
        const goal = await goals.getGoal();
        const goalPrefunc = goal[0].preFund;
        const prize = goalPrefunc / BigInt(2);
        const expectTotalBet = (initBalance - inGoalBalance) + (prize * BigInt(2));
        
        expect(goal[0].totalBet).to.equal(expectTotalBet);
        expect(goal[0].isCompleted).to.equal(true);
        expect(initBalance).to.be.greaterThan(inGoalBalance);
        expect(finalBalance).to.equal(initBalance + prize);
        
      });

      it("Should distribute the right amount of tokens to the premiated participant", async function () {
        // Getting the accounts
        const { goals, goalsToken, owner, otherAccount, thirdAccount, fourthAccount, fithAcount } = await loadFixture(deployFixture);
        
        // Getting the initial balances
        const initBalance = await goalsToken.balanceOf(otherAccount.address);
        const initBalanceThird = await goalsToken.balanceOf(thirdAccount.address);
        const ownerInitBalance = await goalsToken.balanceOf(owner.address);
        
        // Entering the goal
        await goals.connect(otherAccount).enterGoal(0, 100);
        await goals.connect(thirdAccount).enterGoal(0, 100);
        
        // Getting the balances after entering the goal
        const inGoalBalance = await goalsToken.balanceOf(otherAccount.address);
        const inGoalBalanceThird = await goalsToken.balanceOf(thirdAccount.address);
        
        // Starting the goal
        await goals.connect(owner).startGoal(0);

        // Updating the frequencies
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 2");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 3");
        
        // Autenticating the frequencies
        await goals.connect(owner).autenticateFrequency(0, otherAccount.address, 3, [0, 1, 2])
        
        // Completing the goal
        await goals.connect(owner).completeGoal(0);
        
        // Getting the final balances
        const finalBalance = await goalsToken.balanceOf(otherAccount.address);
        const finalBalanceThird = await goalsToken.balanceOf(thirdAccount.address);
        const ownerFinalBalance = await goalsToken.balanceOf(owner.address);

        // Getting the pre fund
        const goal = await goals.getGoal();
        const preFund = goal[0].preFund;

        // Calculating the prize
        const prize = ((initBalanceThird - inGoalBalanceThird) + preFund) / BigInt(2);
        
        expect(finalBalanceThird).to.be.equal(inGoalBalanceThird);
        expect(finalBalance).to.be.equal(initBalance + prize);
        expect(ownerFinalBalance).to.be.equal(ownerInitBalance + prize);
      });

      it("Should distribute the right amount of tokens for the 4 accounts participating", async function () {
        // Getting the accounts
        const { goals, goalsToken, owner, otherAccount, thirdAccount, fourthAccount, fithAcount } = await loadFixture(deployFixture);
        
        // Getting the initial balances
        const ownerInitBalance = await goalsToken.balanceOf(owner.address);

        const initBalance = await goalsToken.balanceOf(otherAccount.address);
        const initBalanceThird = await goalsToken.balanceOf(thirdAccount.address);
        const initBalanceFourth = await goalsToken.balanceOf(fourthAccount.address);
        const initBalanceFith = await goalsToken.balanceOf(fithAcount.address);
        const goal = await goals.getGoal();
        const preFund = goal[0].preFund;

        // console.log("Pre Fund: ", preFund);
        // console.log("Owner Initial Balance: ", ownerInitBalance);
        // console.log("Initial Balance: ", initBalance);
        // console.log("Initial Balance Third: ", initBalanceThird);
        // console.log("Initial Balance Fourth: ", initBalanceFourth);
        // console.log("Initial Balance Fith: ", initBalanceFith);
        // console.log("---------------------------------------------------");
        
        // Entering the goal
        await goals.connect(otherAccount).enterGoal(0, 10000);
        await goals.connect(thirdAccount).enterGoal(0, 10000);
        await goals.connect(fourthAccount).enterGoal(0, 10000);
        await goals.connect(fithAcount).enterGoal(0, 10000);
        
        // Getting the balances after entering the goal
        const inGoalBalance = await goalsToken.balanceOf(otherAccount.address);
        const inGoalBalanceThird = await goalsToken.balanceOf(thirdAccount.address);
        const inGoalBalanceFourth = await goalsToken.balanceOf(fourthAccount.address);
        const inGoalBalanceFith = await goalsToken.balanceOf(fithAcount.address);
        
        // console.log("In Goal Balance: ", inGoalBalance);
        // console.log("In Goal Balance Third: ", inGoalBalanceThird);
        // console.log("In Goal Balance Fourth: ", inGoalBalanceFourth);
        // console.log("In Goal Balance Fith: ", inGoalBalanceFith);
        // console.log("---------------------------------------------------");

        // Starting the goal
        await goals.connect(owner).startGoal(0);
        
        // Updating the frequencies
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 2");
        await goals.connect(otherAccount).updateFrequency(0, "Imagem teste 3");

        await goals.connect(thirdAccount).updateFrequency(0, "Imagem teste");
        await goals.connect(thirdAccount).updateFrequency(0, "Imagem teste 2");

        await goals.connect(fourthAccount).updateFrequency(0, "Imagem teste");

        // Autenticating the frequencies
        await goals.connect(owner).autenticateFrequency(0, otherAccount.address, 3, [0, 1, 2])
        await goals.connect(owner).autenticateFrequency(0, thirdAccount.address, 2, [0, 1])
        await goals.connect(owner).autenticateFrequency(0, fourthAccount.address, 1, [0])
        
        // Completing the goal
        await goals.connect(owner).completeGoal(0);
        
        // Getting the final balances
        const ownerFinalBalance = await goalsToken.balanceOf(owner.address);              //Saldo do owner
        const finalBalance = await goalsToken.balanceOf(otherAccount.address);            //Atingiu 100%
        const finalBalanceThird = await goalsToken.balanceOf(thirdAccount.address);       //Atingiu 66%
        const finalBalanceFourth = await goalsToken.balanceOf(fourthAccount.address);     //Atingiu 33%
        const finalBalanceFith = await goalsToken.balanceOf(fithAcount.address);          //Não atingiu
        

        // console.log("Owner Final Balance: ", ownerFinalBalance);
        // console.log("Final Balance: ", finalBalance);
        // console.log("Final Balance Third: ", finalBalanceThird);
        // console.log("Final Balance Fourth: ", finalBalanceFourth);
        // console.log("Final Balance Fith: ", finalBalanceFith);
        // console.log("---------------------------------------------------");

        // Getting the pre fund
        const prefund = await goals.getGoal();
        const pre = prefund[0].preFund;

        // Calculating the prize
        const prize = ((initBalanceFith - inGoalBalanceFith) + BigInt(Number(initBalanceFourth - inGoalBalanceFourth)*0.666) + preFund)/BigInt(2);

        const prizePerParticipant = prize / BigInt(1);
        
        expect(finalBalance).to.be.equal(initBalance + prizePerParticipant + BigInt(3));
        expect(finalBalanceThird).to.be.equal(initBalanceThird);
        expect(ownerFinalBalance).to.be.equal(ownerInitBalance + prize + BigInt(3));

        // expect(finalBalanceThird).to.be.equal(inGoalBalanceThird);
        // expect(finalBalance).to.be.equal(initBalance + prize);
        // expect(ownerFinalBalance).to.be.equal(ownerInitBalance + prize);


      });
      
    });

  });

});