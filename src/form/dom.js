export const text = (tag, className, value = '') => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	node.textContent = value;
	return node;
};
