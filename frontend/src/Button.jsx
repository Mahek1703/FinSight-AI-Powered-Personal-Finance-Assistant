function Button(props) {
    return (
        <button
            style={
                { backgroundColor: props.backgroundColor, color: props.color, border: "none", borderColor: props.borderColor }}
        >{props.text}</button>
    );
}
export default Button;