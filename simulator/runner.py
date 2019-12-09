import os
import sys
import requests

tools = os.path.join(os.environ["SUMO_HOME"], "tools")
sys.path.append(tools)

API_ENDPOINT = "http://localhost:8080/api/vehicles/step"
SCENARIO_FOLDER = "scenarios/"

sumocfg_scenarios = dict(
    scenario_0=SCENARIO_FOLDER + "scenario_0/testenv.sumocfg",
    scenario_1=SCENARIO_FOLDER + "scenario_1/simulation.sumocfg",
    scenario_2=SCENARIO_FOLDER + "scenario_2/testenv.sumocfg",
)


def sendVehicleData(veh_id, lat, lng, speed, co2):
    data = {
        "veh_id": veh_id,
        "lat": lat,
        "lng": lng,
        "speed": speed,
        "co2": co2,
    }

    requests.post(url=API_ENDPOINT, data=data)


import traci

SUMOCFG_FILE = sumocfg_scenarios["scenario_1"]

sumoBinary = "/usr/bin/sumo-gui"
sumoCmd = [sumoBinary, "-c", SUMOCFG_FILE, "--step-length=1.5"]

traci.start(sumoCmd, label="sim1")

step = 0

# CO2 emissionclass = HBEFA3/PC_G_EU4

while traci.simulation.getMinExpectedNumber() > 0:
    traci.simulationStep()
    for vehicleID in traci.vehicle.getIDList():
        x, y = traci.vehicle.getPosition(vehicleID)
        lng, lat = traci.simulation.convertGeo(x, y)
        speed = traci.vehicle.getSpeed(vehicleID)
        co2 = traci.vehicle.getCO2Emission(vehicleID)

        sendVehicleData(vehicleID, lat, lng, speed, co2)
        print("{}: ({},{}), {}".format(vehicleID, lat, lng, co2))
    step += 1

traci.close()  # traci.close(False)
