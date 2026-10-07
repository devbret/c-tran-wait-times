import argparse
import os
from collections import Counter
from datetime import datetime

import pandas as pd

DAY_COLUMNS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
STOP_TIME_COLUMNS = ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence', 'pickup_type']


def read_table(feed_dir, name, required=True, **kwargs):
    path = os.path.join(feed_dir, name)
    if not required and not os.path.exists(path):
        return None
    return pd.read_csv(path, dtype=str, encoding='utf-8-sig', **kwargs)


def services_by_date(calendar, calendar_dates):
    services = {}
    if calendar is not None:
        for row in calendar.itertuples(index=False):
            start = pd.to_datetime(row.start_date, format='%Y%m%d')
            end = pd.to_datetime(row.end_date, format='%Y%m%d')
            for day in pd.date_range(start, end):
                if getattr(row, DAY_COLUMNS[day.dayofweek]) == '1':
                    services.setdefault(day.strftime('%Y%m%d'), set()).add(row.service_id)
    if calendar_dates is not None:
        for row in calendar_dates.itertuples(index=False):
            active = services.setdefault(row.date, set())
            if row.exception_type == '1':
                active.add(row.service_id)
            else:
                active.discard(row.service_id)
    return services


def typical_weekday(services):
    weekdays = {
        date: frozenset(ids)
        for date, ids in services.items()
        if ids and datetime.strptime(date, '%Y%m%d').weekday() < 5
    }
    if not weekdays:
        raise SystemExit('No weekday service found in the feed; pass --date YYYYMMDD.')
    most_common = Counter(weekdays.values()).most_common(1)[0][0]
    return min(date for date, ids in weekdays.items() if ids == most_common)


def to_seconds(times):
    hms = times.str.strip().str.split(':', expand=True).astype(int)
    return hms[0] * 3600 + hms[1] * 60 + hms[2]


def main():
    parser = argparse.ArgumentParser(description='Estimate the average rider wait time at each stop from a GTFS feed.')
    parser.add_argument('--feed-dir', default='.', help='directory containing the GTFS .txt files')
    parser.add_argument('--date', help='service date to analyze as YYYYMMDD (default: a typical weekday in the feed)')
    parser.add_argument('--output', default='wait_time_per_stop.csv')
    args = parser.parse_args()

    stops = read_table(args.feed_dir, 'stops.txt')
    trips = read_table(args.feed_dir, 'trips.txt')
    stop_times = read_table(
        args.feed_dir, 'stop_times.txt', usecols=lambda c: c in STOP_TIME_COLUMNS
    ).reindex(columns=STOP_TIME_COLUMNS)
    services = services_by_date(
        read_table(args.feed_dir, 'calendar.txt', required=False),
        read_table(args.feed_dir, 'calendar_dates.txt', required=False),
    )

    trip_services = set(trips['service_id'])
    services = {date: ids & trip_services for date, ids in services.items()}
    date = args.date or typical_weekday(services)
    active = services.get(date)
    if not active:
        raise SystemExit(f'No trips run on {date}.')

    stop_times = stop_times.merge(trips[['trip_id', 'service_id']], on='trip_id')
    stop_times = stop_times[stop_times['service_id'].isin(active)].copy()
    stop_times['stop_sequence'] = stop_times['stop_sequence'].astype(int)
    stop_times['departure_time'] = stop_times['departure_time'].fillna(stop_times['arrival_time'])

    last_stop = stop_times['stop_sequence'] == stop_times.groupby('trip_id')['stop_sequence'].transform('max')
    no_pickup = stop_times['pickup_type'].eq('1')
    boardings = stop_times[~last_stop & ~no_pickup].dropna(subset=['departure_time'])
    boardings = boardings.assign(departure_secs=to_seconds(boardings['departure_time']))
    boardings = boardings.sort_values(['stop_id', 'departure_secs'])

    gaps = pd.DataFrame({
        'stop_id': boardings['stop_id'],
        'headway': boardings.groupby('stop_id')['departure_secs'].diff().div(60),
    }).dropna()
    totals = gaps.assign(headway_sq=gaps['headway'] ** 2).groupby('stop_id')[['headway', 'headway_sq']].sum()
    totals = totals[totals['headway'] > 0]
    wait_time = (totals['headway_sq'] / (2 * totals['headway'])).rename('wait_time').reset_index()

    wait_time_per_stop = stops[['stop_id', 'stop_lat', 'stop_lon']].merge(wait_time, on='stop_id')
    wait_time_per_stop.to_csv(args.output, index=False)

    print(f'Service date {date}: {stop_times["trip_id"].nunique()} trips, '
          f'{len(wait_time_per_stop)} stops written to {args.output}')
    print(wait_time_per_stop.head())


if __name__ == '__main__':
    main()
