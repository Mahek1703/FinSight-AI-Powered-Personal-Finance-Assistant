import { useState } from "react";
function Counter(){
    const [count, setCount]=useState(1);
    const handleInr=()=>{
        setCount(count+1);
    }
    const handleDcr=()=>{
        setCount(count-1);
    }
    return (<>
    <h1>Count is : {count}</h1>
    <button onClick={handleInr}>+</button>
    <button onClick={handleDcr}>-</button>
    </>)

}

export default Counter;