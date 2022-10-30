import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
  TreeDataState,
  CustomTreeData,
  SortingState,
  IntegratedSorting,
} from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableHeaderRow,
  TableTreeColumn,
} from '@devexpress/dx-react-grid-material-ui';
import { DataTypeProvider } from '@devexpress/dx-react-grid';

const getChildRows = (row, rootRows) => (row ? row.items : rootRows);

const DeadlineProvider = props => (
  <DataTypeProvider
    formatterComponent={({ value }) => {
      let date = new Date(value);
      return date.toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short",
      })
        .replace(",", "");
    }}
    {...props}
  />
);

const TableRow = ({ row, ...restProps }) => {
  return <Table.Row
    {...restProps}
    onClick={() => {
      BX24.callMethod('profile', {}, res => {
        let userid = res.data()['ID'];
        BX24.openPath(`/company/personal/user/${userid}/tasks/task/view/${row.id}\/`)
      });
    }
    }
    style={{
      cursor: 'pointer',
    }}
  />
};

const HighlightedCell = ({ value, style, ...restProps }) => (
  <Table.Cell
    {...restProps}
  >
    {restProps.row['status'] == 5 ? <><s>{value}</s></> : <>{value}</>}
  </Table.Cell>
);

const TableCell = (props) => {
  const { column } = props;
  if (column.name === 'title') {
    return <HighlightedCell {...props} />;
  }
  return <Table.Cell {...props} />;
};

export default (props) => {
  const [columns] = useState([
    // { name: 'ID', title: 'ID' },
    {
      name: 'title', title: 'Назва', wordWrapEnabled: true
    },
    { name: 'responsible', title: 'Відповідальний', getCellValue: row => row.responsible.name ?? '' },
    {
      name: 'deadline', title: 'Крайній термін',
      getCellValue: row => {
        let date = new Date(row.deadline);
        return date.getTime();
      }
    },
    {
      name: 'status', title: 'Статус',
      getCellValue: row => {
        let value = row.status;
        if (value == 2) {
          return "Чекає виконання";
        }
        else if (value == 3) {
          return "Віконується";
        }
        else if (value == 4) {
          return "Чекає контролю";
        }
        else if (value == 5) {
          return "Завершена";
        }
        else if (value == 6) {
          return "Відкладена";
        }
        return '-';
      }
    },
  ]);
  const [tableColumnExtensions] = useState([
    { columnName: 'title', wordWrapEnabled: true },
    { columnName: 'responsible', width: 250 },
    { columnName: 'deadline', width: 160 },
    { columnName: 'status', width: 150 },
  ]);
  const [deadlineColumn] = useState(['deadline']);
  return (<>
    <>
      <Paper>
        <Grid
          rows={props.rows}
          columns={columns}
          width={"100%"}
        >
          <TreeDataState expandedRowIds={[...Array(99999).keys()]} />
          <CustomTreeData
            getChildRows={getChildRows}
          />
          <DeadlineProvider
            for={deadlineColumn}
          />
          <SortingState
            defaultSorting={[{ columnName: 'deadline', direction: 'asc' }]}
          />
          <IntegratedSorting />
          <Table
            columnExtensions={tableColumnExtensions}
            width="100%"
            rowComponent={TableRow}
            cellComponent={TableCell}
          />
          <TableHeaderRow showSortingControls />
          <TableTreeColumn
            for="title"
            contentComponent={({ children }) => {
              return <>{typeof children == 'string' && children.includes('~') ? <><s>{children.replace('~', '')}</s></> : <>{children}</>}</>
            }}
          />
        </Grid>
      </Paper></>
  </>
  );
};