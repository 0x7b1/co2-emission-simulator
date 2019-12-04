
# CO2 Emission Simulator

This is the repository for the project titled "A distributed real-time simulation based approach for quantifying CO2 emissions of urban car traffic".
It contains the report and two programs that are part of it.

The `server` folder contains the code for the backend part. It does the server gateway logic for the simulation.
To execute the program run `yarn start`

> - collects the information of vehicles (id, lat, lng, ...) on an endpoint
> - then stores them in the database
> - also have another endpoint for collecting and retrieving the data (for clients)

The `web-app` folder contains the code for the frontend tool. It's a visualization tool that gathers info from the server in real time.
To execute the program run `yarn start`

The `simulator` folder contains the code for the simulator. It's an automation tool for SUMO for sending vehicle traffic.
To execute the program run `python runner.py`