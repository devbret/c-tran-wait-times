import pandas as pd

def preprocess_time(time_str):
    parts = time_str.split(':')
    if parts[0] == '24':
        parts[0] = '00'
    elif int(parts[0]) > 24:
        parts[0] = str(int(parts[0]) - 24).zfill(2)
    return ':'.join(parts)

stops_df = pd.read_csv('stops.txt')
stop_times_df = pd.read_csv('stop_times.txt')

stop_times_df['arrival_time'] = stop_times_df['arrival_time'].apply(preprocess_time)
stop_times_df['departure_time'] = stop_times_df['departure_time'].apply(preprocess_time)

stop_times_df['arrival_time_dt'] = pd.to_datetime(stop_times_df['arrival_time'], format='%H:%M:%S', errors='coerce')
stop_times_df['departure_time_dt'] = pd.to_datetime(stop_times_df['departure_time'], format='%H:%M:%S', errors='coerce')

stop_times_df = stop_times_df.sort_values(by=['stop_id', 'arrival_time_dt'])

stop_times_df['next_arrival_time_dt'] = stop_times_df.groupby('stop_id')['arrival_time_dt'].shift(-1)
stop_times_df['wait_time'] = (stop_times_df['next_arrival_time_dt'] - stop_times_df['arrival_time_dt']).dt.total_seconds().div(60)

stop_times_df.dropna(subset=['next_arrival_time_dt'], inplace=True)

combined_df = pd.merge(stop_times_df, stops_df[['stop_id', 'stop_lat', 'stop_lon']], on='stop_id', how='left')

wait_time_per_stop = combined_df.groupby('stop_id').agg({
    'stop_lat': 'first',
    'stop_lon': 'first',
    'wait_time': 'mean'
}).reset_index()

wait_time_per_stop.to_csv('wait_time_per_stop.csv', index=False)

print(wait_time_per_stop.head())
