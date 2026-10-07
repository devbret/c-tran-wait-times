# C-TRAN Average Wait Times

![Screenshot of map visualizing C-TRAN stops.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/fa58702e-dd63-4f99-962f-461d95e20248.png)

Interactive map visualizing average passenger wait times at C-TRAN bus stops in Vancouver, Washington, calculated from publicly available [GTFS schedule data](https://mail.c-tran.com/about-c-tran/business/c-tran-gtfs-data).

## Application Overview

This project turns raw GTFS data into a stop-level dataset and interactive map. The Python script loads `stops.txt` and `stop_times.txt`, normalizes GTFS times that roll past midnight, converts them to datetimes and sorts by `stop_id` and arrival time.

For each stop it computes the gap to the next arrival, averages those stretches to estimate typical rider wait in minutes, joins in latitude/longitude from `stops.txt` and writes a compact `wait_time_per_stop.csv` for mapping and analysis.

The HTML page renders that CSV file onto a Leaflet base map with a D3 overlay. Each stop appears as a scalable bubble whose size and color encode average wait, with fast, debounced re-projection on pan and zoom. Hover tooltips show stop ID and wait; clicking opens an info panel with exact wait, rank, percentile and a meter bar. A built-in legend also summarizes the color ramp and bubble sizes.

## Basic Setup Instructions

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

9. Add the `stops.txt`, `stop_times.txt`, `trips.txt`, `calendar.txt` and `calendar_dates.txt` files to the root of this directory

10. Process the data: `python3 app.py`

11. Start an `HTTP` server: `python3 -m http.server`

12. Open the frontend UI in your browser: `http://localhost:8000`

13. When finished exploring, stop the HTTP server: `CTRL + C`

14. Exit the virtual environment: `deactivate`

## Other Considerations

Below you will find information not covered in the installation and use sections above. Including the abilities this repo is intended to demonstrate. As well as an overview of the license this code is made available with. And a way to contact the maintainer with questions, suggestions and collaboration opportunities.

### Abilities Demonstrated

The purpose of this repo is to demonstrate an ability to do the following:

- Process `GTFS` data to calculate the average wait time between arrivals for each transit stop

- Combine statistics with latitude and longitude data to create a CSV dataset for visualization

- Display each stop as an interactive bubble, where color and size represent average wait time

### License Information

This repository is distributed under the MIT License. You are free to use, copy, modify, merge, publish, distribute, sublicense and sell copies of this software, including as part of proprietary or commercial work. The single condition is the copyright and permission notices contained in the LICENSE file must be included with any copy or substantial portion of the software that you redistribute. The software is provided "as is", without warranty of any kind, and the copyright holder is not liable for any claim or damages arising from its use.

If you found this project interesting, please feel free to visit [my website](https://bretbernhoft.com/) and reach out. It would be interesting to hear from others who are using D3.js to work with publicly available data.
