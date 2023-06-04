import { h } from 'vue';
import { useRoute } from 'vue-router';
import Link from './Link.vue';
const normalizePath = (path) => decodeURI(path)
    .replace(/#.*$/, '')
    .replace(/(index)?\.(md|html)$/, '');
const isActiveLink = (route, link) => {
    if (link === undefined) {
        return false;
    }
    if (route.hash === link) {
        return true;
    }
    const currentPath = normalizePath(route.path);
    const targetPath = normalizePath(link);
    return currentPath === targetPath;
};
const isActiveItem = (route, item) => {
    if (isActiveLink(route, item.link)) {
        return true;
    }
    if (item.children) {
        return item.children.some((child) => isActiveItem(route, child));
    }
    return false;
};
const togglecollapsible = (e, item) => {
    item.collapsible = !!!item.collapsible;
    const currentNode = e.target.querySelector('.arrow');
    const nextNode = e.target.nextElementSibling;
    if (item.collapsible) {
        currentNode.classList.remove('down');
        currentNode.classList.add('right');
        nextNode.style.display = 'none';
    }
    else {
        currentNode.classList.remove('right');
        currentNode.classList.add('down');
        nextNode.style.display = 'block';
    }
};
const renderItem = (item, props) => {
    // if the item has link, render it as `<Link>`
    if (item.link) {
        return h(Link, {
            ...props,
            item,
        });
    }
    // if the item only has text, render it as `<p>`
    return h('h5', { ...props, onClick: (e) => togglecollapsible(e, item) }, [
        item.text,
        h('span', {
            class: !!item.collapsible ? 'arrow right' : 'arrow down',
        }),
    ]);
};
const renderChildren = (item) => {
    var _a;
    if (!((_a = item.children) === null || _a === void 0 ? void 0 : _a.length)) {
        return null;
    }
    return h('ul', {
        style: {
            display: !!item.collapsible ? 'none' : 'block',
        },
    }, item.children.map((child) => h('li', h(SeriesItem, {
        item: child,
    }))));
};
export const SeriesItem = ({ item }) => {
    const route = useRoute();
    const active = isActiveItem(route, item);
    if (item.children) {
        return [
            h('section', {
                class: 'series-group series-item',
            }, [
                renderItem(item, {
                    class: {
                        'series-heading': true,
                        active,
                    },
                }),
                renderChildren(item),
            ]),
        ];
    }
    return [
        renderItem(item, {
            class: {
                'series-item': true,
                active,
            },
        }),
    ];
};
SeriesItem.displayName = 'SeriesItem';
SeriesItem.props = {
    item: {
        type: Object,
        required: true,
    },
};
