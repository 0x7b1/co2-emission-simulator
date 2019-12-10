import os
import sys
import requests
import logging

tools = os.path.join(os.environ["SUMO_HOME"], "tools")
sys.path.append(tools)

API_ENDPOINT = "http://localhost:8080/api/vehicles/step"
SCENARIO_FOLDER = "scenarios/"

sumocfg_scenarios = dict(
    scenario_0=SCENARIO_FOLDER + "scenario_0/testenv.sumocfg",
    scenario_1=SCENARIO_FOLDER + "scenario_1/simulation.sumocfg",
    scenario_2=SCENARIO_FOLDER + "scenario_2/scenario/most.traci.sumocfg",
)


def sendVehicleData(veh_id, time_sec, lat, lng, speed, co2):
    data = {
        "veh_id": veh_id,
        "lat": lat,
        "lng": lng,
        "speed": speed,
        "co2": co2,
        "time_offset_sec": time_sec,
    }

    requests.post(url=API_ENDPOINT, data=data)


import traci
import traci.constants as tc

SUMOCFG_FILE = sumocfg_scenarios["scenario_2"]

sumoBinary = "/usr/bin/sumo-gui"
sumoCmd = [sumoBinary, "-c", SUMOCFG_FILE, "--step-length=1.0", "-S", "-Q"]

traci.start(sumoCmd, label="sim1")

# CO2 emissionclass = HBEFA3/PC_G_EU4

SEC_TO_MIN = 60
SEC_TO_HOUR = SEC_TO_MIN * 60

begin_sec = 0
end_sec = SEC_TO_HOUR * 5

# traci.vehicle.subscribe(vehID, (tc.VAR_ROAD_ID, tc.VAR_LANEPOSITION))


def main():
    try:
        # while traci.simulation.getMinExpectedNumber() > 0:
        for step in range(begin_sec, end_sec):
            traci.simulationStep()
            for vehicleID in traci.vehicle.getIDList():
                time_sec = traci.simulation.getTime()

                x, y = traci.vehicle.getPosition(vehicleID)
                lng, lat = traci.simulation.convertGeo(x, y)
                speed = traci.vehicle.getSpeed(vehicleID)
                co2 = traci.vehicle.getCO2Emission(vehicleID)

                sendVehicleData(vehicleID, time_sec, lat, lng, speed, co2)
                print(
                    "{} => {}: ({},{}), {}".format(time_sec, vehicleID, lat, lng, co2)
                )
    except traci.exceptions.TraCIException:
        logging.fatal("Fatal error at timestamp %.2f", _time)

    finally:
        ### Save results!
        traci.close()


if __name__ == "__main__":
    main()
