import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Goals = buildModule("Goals",  (m) => {
    const token = m.contract("GoalsToken", []);
    const goals = m.contract("Goals", [token]);

    return { token, goals };
});



export default Goals;