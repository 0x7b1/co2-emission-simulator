import os
import sys
import requests

tools = os.path.join(os.environ["SUMO_HOME"], "tools")
sys.path.append(tools)

API_ENDPOINT = "http://localhost:8080/api/vehicles/timestamp"


def sendVehicleData(lat, lng, speed):
    data = {
        "lat": lat,
        "lng": lng,
        "speed": speed,
    }

    requests.post(url=API_ENDPOINT, data=data)


import traci

sumoBinary = "/usr/bin/sumo-gui"
sumoCmd = [sumoBinary, "-c", "hello.sumocfg"]

traci.start(sumoCmd, label="sim1")

step = 0

while traci.simulation.getMinExpectedNumber() > 0:
    traci.simulationStep()
    for vehicleID in traci.vehicle.getIDList():
        x, y = traci.vehicle.getPosition(vehicleID)
        lng, lat = traci.simulation.convertGeo(x, y)
        speed = traci.vehicle.getSpeed(vehicleID)
        sendVehicleData(lat, lng, speed)
        print(speed)
    step += 1

traci.close()  # traci.close(False)
