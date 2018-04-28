const db  = require('./index');


// {
//   "id":"123abc", #A string generated by your API
//   "number": 5, #The the slip number, essentially the human understandable identifier
//   "current_boat":"abc555",  #The id of the current boat, null if empty
//   "arrival_date":"1/1/2015", #A string indicating the date the boat arrived in the slip
//   "departure_history":[{"departure_date":"11/4/2014","departed_boat":"123aaa"}...] #Optional for 5% extra credit a list of the dates that previous boats departed the slip
// }

const KIND = 'slip';


async function getAllSlips() {
  try {
    return await db.getAllOfKind(KIND);
  } catch (error) {
    throw error;
  }
}


async function createSlip({ number }) {
  try {
    const data = {
      number,
      current_boat: '',
      arrival_date: '',
      departure_history: []
    };

    return await db.createEntity({ KIND, data });
  } catch (error) {
    throw error;
  }
}


async function getSlip({ id }){
  try {
    return await db.getEntityById({ KIND, id });
  } catch (error) {
    throw error;
  }
}


async function updateSlip({ id, number, current_boat, arrival_date, departure_history }) {
  try {
    const data = {
        number,
        current_boat,
        arrival_date,
        departure_history
    };

    return await db.updateEntity({ KIND, id, data });
  } catch (error) {
    throw error;
  }
}


async function deleteSlip({ id }) {
  try {
    return await db.deleteEntity({ KIND, id });
  } catch (error) {
    throw error;
  }
}


async function getFirstAvailable() {
  return await db.firstAvailableEntityByFilter({
    KIND,
    key:    'current_boat',
    value:  ''
  });
}


async function getByBoatId({ boatid }) {
  return await db.firstAvailableEntityByFilter({
    KIND,
    key:    'current_boat',
    value:  boatid
  });
}



async function isUnique({ number }) {
  const response = await db.filterDatabase({
    KIND,
    key:    'number',
    value:  number
  });

  if ( response[0].length > 0 )
    return false;
  else
    return true;
}


async function deleteBoat({ boatid }) {
  const now             = new Date();
  const slips           = await getAllSlips();
  let shouldUpdateSlip  = false;

  slips.forEach( async function(slip) {
    shouldUpdateSlip = false;

    if( slip.current_boat === boatid ) {
      let history = {};
      history.departure_date  = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
      history.departed_boat = 'undefined'
      slip.departure_history  = slip.departure_history.concat( [history], slip.departure_history);

      slip.current_boat = '';
      slip.arrival_date = '';
      shouldUpdateSlip  = true;
    }

    slip.departure_history.forEach( history => {
      if( history.departed_boat === boatid ){
        history.departed_boat = 'undefined';
        shouldUpdateSlip = true;
      }
    });

    if(shouldUpdateSlip)
      await updateSlip(slip);
  });

  return;
}


async function arriveBoatFirstAvailable({ boatid }) {
  const now   = new Date();
  const slip  = await getFirstAvailable();
  slip.current_boat = boatid;
  slip.arrival_date = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;

  return await updateSlip(slip);
}


async function arriveBoatForSlip({ boatid, slipid }) {
  const now   = new Date();
  const slip  = await getSlip({ id: slipid });

  if(slip.current_boat !== '') {
    let err = Error('Slip Not Empty');
    err.name = 'OccupiedSlipError';
    throw err;
  }

  slip.current_boat = boatid;
  slip.arrival_date = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;

  return await updateSlip(slip);
}


async function departBoat({ boatid }) {
  const now   = new Date();
  const slip  = await getByBoatId({ boatid });
  if(!slip) throw Error;

  let history = {};

  history.departure_date  = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
  history.departed_boat   = boatid;
  slip.departure_history  = slip.departure_history.concat( [history], slip.departure_history);

  slip.current_boat = '';
  slip.arrival_date = '';

  return await updateSlip(slip);
}


module.exports = {
  getAllSlips,
  createSlip,
  getSlip,
  updateSlip,
  deleteSlip,
  getFirstAvailable,
  getByBoatId,
  arriveBoatFirstAvailable,
  arriveBoatForSlip,
  departBoat,
  deleteBoat,
  isUnique
}
