# C-TRAN Average Wait Times

![Screenshot of map visualizing C-TRAN stops.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/3e67cb89-cc9f-4e63-bb0f-9460e7910927.png)

Interactive map visualizing average passenger wait times at C-TRAN bus stops in Vancouver, Washington, calculated from publicly available [GTFS schedule data](https://mail.c-tran.com/about-c-tran/business/c-tran-gtfs-data).

## Overview

This project turns raw GTFS data into a stop-level dataset and interactive map. The Python script loads `stops.txt` and `stop_times.txt`, normalizes GTFS times that roll past midnight, converts them to datetimes and sorts by `stop_id` and arrival time.

For each stop it computes the gap to the next arrival, averages those stretches to estimate typical rider wait in minutes, joins in latitude/longitude from `stops.txt` and writes a compact `wait_time_per_stop.csv` for mapping and analysis.

The HTML page renders that CSV file onto a Leaflet base map with a D3 overlay. Each stop appears as a scalable bubble whose size and color encode average wait, with fast, debounced re-projection on pan and zoom. Hover tooltips show stop ID and wait; clicking opens an info panel with exact wait, rank, percentile and a meter bar. A built-in legend also summarizes the color ramp and bubble sizes.

## Set Up Instructions

Below are the required software programs and set up steps for using this application on a Linux machine.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps

1. Install the above programs

2. Open a terminal

3. Clone this repository: `git clone git@github.com:devbret/c-tran-wait-times.git`

4. Navigate to the repo's directory: `cd c-tran-wait-times`

5. Create a virtual environment: `python3 -m venv venv`

6. Activate your virtual environment: `source venv/bin/activate`

7. Install the needed dependencies: `pip install -r requirements.txt`

8. Download the source [GTFS schedule data](https://mail.c-tran.com/about-c-tran/business/c-tran-gtfs-data) from the C-TRAN website

9. Add the `stops.txt` and `stop_times.txt` files to the root of this directory

10. Process the data: `python3 app.py`

11. Start an `HTTP` server: `python3 -m http.server`

12. Open the frontend UI in your browser: `http://localhost:8000`

13. When finished exploring, stop the HTTP server: `CTRL + C`

14. Exit the virtual environment: `deactivate`

## Additional Notes

The purpose of this repo is to demonstrate an ability to do the follwoing:

- Process `GTFS` data to calculate the average wait time between arrivals for each transit stop

- Combine statistics with latitude and longitude data to create a CSV dataset for visualization

- Display each stop as an interactive bubble, where color and size represent average wait time

If you found this project interesting, please feel free to visit [my website](https://bretbernhoft.com/) and reach out. It would be interesting to hear from others who are using D3.js to work with publicly available data.
