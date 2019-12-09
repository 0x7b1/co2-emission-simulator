# ----------------------
# Script by Carlos-Ramos
# ----------------------

# Helper variables
ITERATION_ID	= 1
OUT_FOLDER		= output

# Required files on folder
CONFIG_FILE		= simulation.sumocfg
GUI_SETTINGS	= simulation.settings.xml
OSM_FILE			= map.osm
ADD_FILE			= additional.xml

# Generated files
NET_FILE			= map.net.xml
ROUTES_FILE		= routes.xml
OUT_TRIP_INFO	= $(OUT_FOLDER)/tripinfo.xml
OUT_SUMMARY		= $(OUT_FOLDER)/summary.xml
OUT_EMISS_VEH	= $(OUT_FOLDER)/emissions_vehicles.xml
OUT_EDGE_DAT	= $(OUT_FOLDER)/edges_data.xml
OUT_EDGE_EMI	= $(OUT_FOLDER)/edges_emissions.xml

osm_to_network:
	netconvert --osm-files $(OSM_FILE) -o $(NET_FILE)

generate_random_trips:
	${SUMO_HOME}/tools/randomTrips.py -n $(NET_FILE) -e 60 -r $(ROUTES_FILE)

plot_net_dump:
	${SUMO_HOME}/tools/visualization/plot_net_dump.py \
		-v \
		-n $(NET_FILE) \
		-i $(OUT_EDGE_DAT),$(OUT_EDGE_DAT) \
		-o $(OUT_FOLDER)/plot_avg_speed_$(ITERATION_ID).png \
		-m speed,speed \
		--title "Network edge speed" \
		--color-bar-label speed

plot_net_speeds:
	${SUMO_HOME}/tools/visualization/plot_net_speeds.py  \
		-v \
		-n $(NET_FILE) \
		-o $(OUT_FOLDER)/plot_speeds_$(ITERATION_ID).png \
		--title "Network speed" \
		--colormap jet

plot_summary_running:
	${SUMO_HOME}/tools/visualization/plot_summary.py \
		-i $(OUT_SUMMARY) \
		-o $(OUT_FOLDER)/plot_summary_$(ITERATION_ID).png \
		--title "Summary of running simulation" \
		--ylabel "running vehicles #" --xlabel "time in s" --measure running --xlim 0,1000

plot_tripinfo_distributions_duration:
	${SUMO_HOME}/tools/visualization/plot_tripinfo_distributions.py \
		-i $(OUT_TRIP_INFO) \
		-o $(OUT_FOLDER)/plot_tripinfo_$(ITERATION_ID).png \
		--title "Trip info distribution duration" \
		--ylabel "vehicle #" --xlabel "duration of trip in s" --measure duration

plot_emissions:
	${SUMO_HOME}/tools/visualization/plot_net_dump.py \
		--net $(NET_FILE) \
		--dump-inputs=$(OUT_EDGE_EMI),$(OUT_EDGE_EMI) \
		-o $(OUT_FOLDER)/plot_emission_CO2_perVeh_$(ITERATION_ID).png \
		--colormap jet \
		-m CO2_perVeh, CO2_perVeh \
		--title "Emission [CO2_perVeh]" \
		--default-width 0.8 # --xlim 5000,8000 --ylim 6000,8500

simulate:
	sumo-gui -c $(CONFIG_FILE) \
		-r $(ROUTES_FILE) \
		-n $(NET_FILE) \
		-g $(GUI_SETTINGS) \
		-a $(ADD_FILE) \
		--emission-output $(OUT_EMISS_VEH) \
		--summary-output $(OUT_SUMMARY) \
		--tripinfo-output $(OUT_TRIP_INFO)

clean:
	rm -rf $(OUT_FOLDER) $(NET_FILE) $(ROUTES_FILE)
	mkdir $(OUT_FOLDER)

iteration: simulate plot_net_dump plot_emissions plot_net_speeds plot_summary_running plot_tripinfo_distributions_duration

default: all

.PHONY: clean all