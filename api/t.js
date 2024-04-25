const array = ["a", "b", ["c", "d", "e"], "f", "g"];

const formatArray = arr => {
    return arr.map(item => 
        Array.isArray(item) 
            ? `("${item.join('" or "')}")` 
            : `"${item}"`
    ).join(' and ');
};

const formattedString = formatArray(array);
console.log(formattedString);
