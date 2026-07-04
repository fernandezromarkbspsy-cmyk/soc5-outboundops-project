<script setup lang="ts">
const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#18181b' : '#ffffff')
useHead({ meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { key: 'theme-color', name: 'theme-color', content: color }], htmlAttrs: { lang: 'en' } })
useSeoMeta({ title: 'SOC 5 Outbound Operations', description: 'SOC 5 outbound operations dashboard' })
</script>

<template><UApp><NuxtLoadingIndicator/><NuxtPage/></UApp></template>
