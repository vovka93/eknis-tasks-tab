import { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import Datatable from './components/datatable';
import './App.css'

var BX24 = window.BX24 || {
  callMethod: (method, params = {}, callback) => {
    let result = {};
    switch (method) {
      case 'profile':
        result = {
          "ID": "396",
          "ADMIN": true,
          "NAME": "Оплати від Замовників",
          "LAST_NAME": "",
          "PERSONAL_GENDER": "",
          "TIME_ZONE": "",
          "TIME_ZONE_OFFSET": 10800
        };
        break;
      default:
        result = {};
    }
    callback({
      data: () => {
        return result;
      }
    });
  },
  placement: {
    info: () => {
      return {
        "placement": "CRM_DEAL_DETAIL_TAB",
        "options": {
          "ID": "8366"
        }
      };
    }
  }
}

const columns = [
  {
    field: 'parentId', headerName: '',
    valueGetter: (params) => {
      return params.row['parentId'] > 0 ? Number(params.row['parentId']) + 0.001 : params.row['id'];
    }
  },
  { field: 'id', headerName: 'ID', sortable: false, width: 70 },
  {
    field: 'title',
    headerName: 'Назва',
    sortable: false,
    minWidth: 500,
    flex: 1,
    editable: false,
    renderCell: (params) => {
      if (params.row['status'] == 5)
        return <><s>{params.value}</s></>;
      return <>{params.value}</>;
    },
    valueGetter: (params) => {
      return params.row['title'];
    }
  },
  {
    field: 'responsible',
    headerName: 'Відповідальний',
    sortable: false,
    width: 250,
    valueGetter: (params) => {
      return params.row['responsible']['name'];
    }
  },
  {
    field: 'deadline',
    headerName: 'Крайній термін',
    sortable: true,
    width: 160,
    valueFormatter: ({ value }) =>
      value
        ?.toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        })
        .replace(",", ""),
    valueGetter: ({ value }) => value && new Date(value),
  },
  {
    field: 'status',
    headerName: 'Статус',
    sortable: false,
    width: 150,
    valueGetter: ({ value }) => {
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
    }
  },
];


var nPageSize = 50;
var select = ['ID', 'TITLE', 'RESPONSIBLE_ID', 'STATUS', 'DEADLINE', 'UF_CRM_TASK', 'PARENT_ID'];

function getTasks(iNumPage = 0, entityName, entityID) {
  return new Promise((resolve, reject) => {
    BX24.callMethod(`tasks.task.list`, {
      filter: {
        UF_CRM_TASK: entityName.charAt(0).toUpperCase() + '_' + entityID,
      },
      select,
      // start: iNumPage * nPageSize,
      start: 0,
    }, (res) => {
      if (Array.isArray(res.data()["tasks"])) {
        resolve(res.data()["tasks"]);
      } else {
        reject([]);
      }
    });
  })
}

function App() {
  const [user, setUser] = useState({});
  const [dealID, setDealID] = useState(0);
  const [page, setPage] = useState(0);
  const [leadID, setLeadID] = useState(0);
  const [placementInfo, setPlacementInfo] = useState({});
  const [entityName, setEntityName] = useState('');
  // const [entity, setEntity] = useState({ });
  const [tasks, setTasks] = useState([]);
  const [isBatch, setIsBatch] = useState(false);

  useEffect(() => {
    if ((window).BX24) {
      (window).BX24.fitWindow();
    }
  });

  useEffect(() => {
    BX24.callMethod('profile', {}, (res) => {
      setUser(res.data());
    });
    setPlacementInfo(BX24.placement.info());
  }, []);

  useEffect(() => {
    if (placementInfo.placement) {
      if (placementInfo.placement == 'CRM_DEAL_DETAIL_TAB') {
        setDealID(placementInfo.options.ID);
      }
      if (placementInfo.placement == 'CRM_LEAD_DETAIL_TAB') {
        setLeadID(placementInfo.options.ID);
      }
    }
  }, [placementInfo?.placement]);

  useEffect(() => {
    setEntityName(dealID ? 'deal' : leadID ? 'lead' : '');
  }, [dealID, leadID]);

  useEffect(() => {
    if (entityName != '') {

      // BX24.callMethod(`crm.${entityName}.get`,
      //   { id: dealID || leadID }, (res) => {
      //     setEntity(res.data());
      //   });

      getTasks(page, entityName, (dealID || leadID)).then((taskList) => {
        setTasks(taskList);
      });

    }
  }, [entityName]);

  useEffect(() => {
    if (page && tasks.length < (page + 1) * nPageSize) {
      getTasks(page, entityName, (dealID || leadID)).then((taskList) => {
        setTasks(taskList.map(t1 => ({ ...t1, ...tasks.find(t2 => t2.id === t1.id) })))
      });
    }
  }, [page]);

  function getTasksFromResult(result, id) {
    if (result && result[`task${id}`]) {
      if (typeof result[`task${id}`].data === 'function') {
        let data = result[`task${id}`].data();
        if (data['tasks'].length) {
          return data['tasks'];
        }
      }
    }
    return [];
  }

  function getBatch(taskIDs) {
    let batch = {};
    taskIDs.map(id => {
      let batchName = `task${id}`;
      batch[batchName] = [
        'tasks.task.list', {
          filter: {
            PARENT_ID: id,
          },
          select
        }
      ];
    });
    return batch;
  }

  function getChilds(taskList, level = 1) {
    return new Promise((resolve, reject) => {
      let taskIDs = taskList.map(task => task.id);
      let batch = getBatch(taskIDs);
      let childs = [];
      if (taskIDs.length) {
        BX24.callBatch(batch, (result) => {
          resolve(taskIDs.map(id => getTasksFromResult(result, id)).flat(1));
        });
      }
    });
  }

  function buildTree(tasks, level = 1) {
    tasks = tasks.map(task => {
      if (task && task.status && task.status == '5')
        task['title'] = '~' + task['title'];
      return task;
    });
    return new Promise((resolve) => {
      getChilds(tasks).then((childs) => {
        childs.map(child => {
          tasks = tasks.map((task) => {
            if (child.parentId == task.id && child) {
              if (task.items) {
                task.items.push(child);
              } else {
                task.items = [child];
              }
            }
            return task;
          })
        });
        resolve(Promise.all(tasks.map(task => {
          return new Promise(resolve => {
            if (task.items && task.items.length) {
              buildTree(task.items).then(tree => {
                task.items = tree;
                resolve(task);
              })
            } else {
              resolve(task);
            }
          });
        })));
      })
    })
  }


  useEffect(() => {
    if (tasks.length && !isBatch) {
      buildTree(tasks).then((tree) => {
        setTasks(tree);
      })
      setIsBatch(true);
    }
  }, [tasks?.length]);

  const handleEvent = (
    params, // GridRowParams
    event, // MuiEvent<React.MouseEvent<HTMLElement>>
    details // GridCallbackDetails
  ) => {

  };


  return (
    <>
      {/* <pre>{JSON.stringify(tasks, null, 2)}</pre> */}
      <Box sx={{ height: '1024px', width: '100%' }}>
        {(tasks && tasks.length > 0) ? <Datatable
          rows={tasks}
        /> : <Typography>Не знайдено</Typography>}
      </Box>
    </>
  )
}

export default App
