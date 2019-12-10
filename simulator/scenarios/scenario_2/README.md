## Monaco SUMO Traffic (MoST) Scenario

Contacts: Lara CODECA [codeca@eurecom.fr], A-Team [a-team@eurecom.fr]
This project is licensed under the terms of the GPLv3 license.

MoST Scenario is meant to be used with SUMO (Simulator of Urban MObility).
* It has been tested with [SUMO 1.0.1](https://github.com/eclipse/sumo/tree/v1_0_1) and [SUMO 1.1.0](https://github.com/eclipse/sumo/tree/v1_1_0).
* In case there are problems with multi-threading, check that [Issue #4518](https://github.com/eclipse/sumo/issues/4518) has been solved in your target version.

Please refer to the [SUMO wiki](http://sumo.dlr.de/wiki/Simulation_of_Urban_MObility_-_Wiki) for further information on the simulator itself.

#### How to cite it: [BibTeX](https://github.com/lcodeca/MoSTScenario/blob/master/cite.bib)
L. Codeca, J. Härri,
*"Towards Multimodal Mobility Simulation of C-ITS: The Monaco SUMO Traffic Scenario"*
VNC 2017, IEEE Vehicular Networking Conference
November 27-29, 2017, Torino, Italy.

or

L. Codeca, J. Härri,
*"Monaco SUMO Traffic (MoST) Scenario: A 3D Mobility Scenario for Cooperative ITS"*
SUMO 2018, SUMO User Conference, Simulating Autonomous and Intermodal Transport Systems
May 14-16, 2018, Berlin, Germany

### How To:
MoST Scenario can be lunched directly with its configuration file.
* `sumo -c most.sumocfg` or `run.sh` from the _scenario_ folder.

To use the scrips in the `tools` directory it's necessary to exec `source setenv.sh`.
#### See [Scenario re-genration](https://github.com/lcodeca/MoSTScenario/wiki/How-to-rebuild-the-scenario.)

#### Files:
* `scenario` is the ready-to-use scenario
* `tools/mobility` contains the files required to generate various traffic demands.
* `tools/parkings` contains the an example of parking mornitoring done with [PyPML](https://github.com/lcodeca/PyPML).
* `tools/static` contains the raw OSM-like file, scripts, and configuration files to regenerate the scenario from the beginning.

Note: the configuration files contained in `tools/static/typemap` are a slightly modified version of a subset of the SUMO files available at https://github.com/eclipse/sumo/tree/master/data/typemap.

#### Mobility Example
[![Mobility Example](https://img.youtube.com/vi/nFVhodnJKws/0.jpg)](https://www.youtube.com/watch?v=nFVhodnJKws)
(click on the image for the video)

#### Traffic Light Example
[![Traffic Light Example](https://img.youtube.com/vi/Wwp_riSsLAs/0.jpg)](https://www.youtube.com/watch?v=Wwp_riSsLAs)
(click on the image for the video)

#### Public Transportation Example
[![Public Transportation Example](https://img.youtube.com/vi/r7iE3LRiSNA/0.jpg)](https://www.youtube.com/watch?v=r7iE3LRiSNA)
(click on the image for the video)

### Users:
* Vincent Terrier, Aerospace System Design Laboratory, Georgia Institute of Technology, Atlanta, GA 30332-0105
* Tianshu Chu, Civil and Environmental Engineering, Stanford University

If you are using MoST Scenario, or its tools to generate a new one, we would gladly add you to the list.
You can send an e-mail to codeca@eurecom.fr with your name and affiliation (if any).

### Tested with:

#### Eclipse SUMO Version 1.2.0
(Build features: Linux-4.19.0-4-amd64 x86_64 GNU 8.3.0 Release Proj GUI GDAL FFmpeg OSG GL2PS SWIG)

```
Performance:
 Duration: 8071937ms
 Real time factor: 4.4599
 UPS: 151124.323691
Vehicles:
 Inserted: 46809 (Loaded: 46810)
 Running: 31
 Waiting: 0
Teleports: 1151 (Jam: 462, Yield: 504, Wrong Lane: 185)
Emergency Stops: 6
Persons:
 Inserted: 45000
 Running: 0
 Jammed: 1260
Statistics (avg):
 RouteLength: ... TBD
 Duration: 6518.88
 WaitingTime: 130.35
 TimeLoss: 268.94
 DepartDelay: 0.83
Pedestrian Statistics (avg of 31495 walks):
 RouteLength: 447.76
 Duration: 381.52
 TimeLoss: 54.46
Ride Statistics (avg of 45362 rides):
 WaitingTime: 50.99
 RouteLength: 6237.22
 Duration: 750.87
 Bus: 6131
 Train: 1
 Bike: 3395
 Aborted: 0
```

#### Eclipse SUMO Version 1.1.0
(Build features: Linux-4.19.0-4-amd64 x86_64 GNU 8.3.0 Release Proj GUI GDAL FFmpeg OSG GL2PS SWIG)

```
Performance:
 Duration: 7509321ms
 Real time factor: 4.79404
 UPS: 162345.771475
Vehicles:
 Inserted: 46810
 Running: 31
 Waiting: 0
Teleports: 566 (Jam: 182, Yield: 275, Wrong Lane: 109)
Emergency Stops: 12
Persons:
 Inserted: 45000
 Running: 0
 Jammed: 793
Statistics (avg):
 RouteLength: 7474.31
 Duration: 6514.68
 WaitingTime: 85.81
 TimeLoss: 217.45
 DepartDelay: 0.57
Pedestrian Statistics (avg of 31495 walks):
 RouteLength: 342.99
 Duration: 292.18
 TimeLoss: 41.27
Ride Statistics (avg of 45362 rides):
 WaitingTime: 48.07
 RouteLength: 6640.66
 Duration: 735.61
 Bus: 6131
 Train: 1
 Bike: 3395
 Aborted: 0
 ```