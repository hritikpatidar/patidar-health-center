import { RATIO_RECORD } from "../Actions/Ratio.jsx";

const initialState = { ratio: "0" };

export default function rootReducer(state = initialState, action) {
  switch (action.type) {
    case RATIO_RECORD:
      return { ...state, ratio: "2" };
    default:
      return state;
  }
}
