import { ref } from 'vue';
export const useMobileMenus = () => {
    const isOpenMobileMenus = ref(false);
    const toggleMobileMenus = (to) => {
        isOpenMobileMenus.value = typeof to === 'boolean' ? to : !isOpenMobileMenus.value;
    };
    return { isOpenMobileMenus, toggleMobileMenus };
};
