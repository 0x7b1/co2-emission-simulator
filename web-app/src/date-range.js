import React, { useState } from 'react';
import { useStyletron } from 'baseui';
import { FormControl } from 'baseui/form-control';
import ArrowRight from 'baseui/icon/arrow-right';
import { Datepicker, formatDate } from 'baseui/datepicker';
import { TimePicker } from 'baseui/timepicker';

function formatDateAtIndex(dates, index, ) {
  if (!dates || !Array.isArray(dates)) return '';
  const date = dates[index];

  if (!date) return '';
  return formatDate(date, 'yyyy/MM/dd');
}

function DateRange(props) {
  const {
    startDate,
    endDate,
    filterDataRange,
  } = props;

  const [css, theme] = useStyletron();
  const dates = [new Date(startDate), new Date(endDate)];
  console.log('----dates----', dates);

  return (
    <div className={css({ display: 'flex', alignItems: 'center' })}>
      <div
        className={css({
          width: '120px',
          marginRight: theme.sizing.scale300,
        })}
      >
        <FormControl label='Start Date'>
          <Datepicker
            value={dates}
            // onChange={({ date }) => setDates(date)}
            // console.log('DATE', min, max);
            // onChange={({ date: [min = startDate, max = endDate] }) => {
            onChange={({ date: [min, max] }) => {
              console.log('ONCHANGE', min, max);
              const a = +formatDate(min, 'T');
              const b = +formatDate(max, 'T');

              console.log('DUE?', a, b);
              filterDataRange({
                value: [
                  a,
                  b,
                ],
              });
            }}
            formatDisplayValue={date => formatDateAtIndex(date, 0)}
            timeSelectStart
            range
            mask="9999/99/99"
          />
        </FormControl>
      </div>

      {/* <div
        className={css({
          width: '120px',
          marginRight: theme.sizing.scale300,
        })}
      >
        <FormControl label="Start Time">
          <TimePicker
            value={dates[0]}
          // onChange={time => setDates([time, dates[1]])}
          />
        </FormControl>
      </div>

      <div
        className={css({
          marginRight: theme.sizing.scale300,
        })}
      >
        <ArrowRight size={24} />
      </div>

      <div
        className={css({
          width: '120px',
          marginRight: theme.sizing.scale300,
        })}
      >
        <FormControl label="End Date">
          <Datepicker
            value={dates}
            // onChange={({ date }) => setDates(date)}
            formatDisplayValue={date => formatDateAtIndex(date, 1)}
            overrides={{
              TimeSelectFormControl: {
                props: { label: 'End time' },
              },
            }}
            timeSelectEnd
            range
            mask="9999/99/99"
          />
        </FormControl>
      </div>

      <div
        className={css({
          width: '120px',
        })}
      >
        <FormControl label="End Time">
          <TimePicker
            value={dates[1]}
          // onChange={time => setDates([dates[0], time])}
          />
        </FormControl>
      </div> */}

    </div>
  );
}

export default DateRange;
