import os
import sys
import requests
import logging

tools = os.path.join(os.environ["SUMO_HOME"], "tools")
sys.path.append(tools)

API_ENDPOINT = "http://localhost:8080/api/vehicles/step"
SCENARIO_FOLDER = "scenarios/"
SCENARIO_SELECTED = os.getenv("SCENARIO")

if SCENARIO_SELECTED is None:
    print("First set a scenario!")
    sys.exit()

sumocfg_scenarios = dict(
    simple=SCENARIO_FOLDER + "simple/testenv.sumocfg",
    tartu=SCENARIO_FOLDER + "tartu/simulation.sumocfg",
    monaco=SCENARIO_FOLDER + "monaco/scenario/most.sumocfg",
)


def send_vehicle_data(veh_id, time_sec, lat, lng, speed, co2):
    data = {
        "veh_id": veh_id,
        "lat": lat,
        "lng": lng,
        "speed": speed,
        "co2": co2,
        "time_offset_sec": time_sec,
        "scenario": SCENARIO_SELECTED,
    }

    requests.post(url=API_ENDPOINT, data=data)


def print_log(time_sec, vehicleID, lat, lng, co2):
    print("{} => {}: ({},{}), {}".format(time_sec, vehicleID, lat, lng, co2))


import traci
import traci.constants as tc

SUMOCFG_FILE = sumocfg_scenarios[SCENARIO_SELECTED]

sumoBinary = "/usr/bin/sumo-gui"
sumoCmd = [sumoBinary, "-c", SUMOCFG_FILE, "--step-length=1.0", "-S", "-Q"]

traci.start(sumoCmd, label="sim1")

# CO2 emissionclass = HBEFA3/PC_G_EU4

SEC_TO_MIN = 60
SEC_TO_HOUR = SEC_TO_MIN * 60

begin_sec = 0
end_sec = SEC_TO_HOUR * 5
# end_sec = SEC_TO_MIN * 2


def main():
    try:
        for step in range(begin_sec, end_sec):
            traci.simulationStep()

            # Finish if there is no vehicle running
            if traci.simulation.getMinExpectedNumber() <= 0:
                break

            for vehicleID in traci.vehicle.getIDList():
                time_sec = traci.simulation.getTime()

                x, y = traci.vehicle.getPosition(vehicleID)
                lng, lat = traci.simulation.convertGeo(x, y)
                speed = traci.vehicle.getSpeed(vehicleID)
                co2 = traci.vehicle.getCO2Emission(vehicleID)

                send_vehicle_data(vehicleID, time_sec, lat, lng, speed, co2)
                print_log(time_sec, vehicleID, lat, lng, co2)

    except traci.exceptions.TraCIException:
        logging.fatal("Fatal error at timestamp %.2f", _time)

    finally:
        ### Save results!
        traci.close()


if __name__ == "__main__":
    main()
