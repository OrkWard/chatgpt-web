<script setup lang='ts'>
import { computed } from 'vue'
import { NLayoutContent } from 'naive-ui'
import { useRouter } from 'vue-router'
import Permission from './Permission.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore, useChatStore } from '@/store'

const router = useRouter()
// const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

const { isMobile } = useBasicLayout()

// const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !!authStore.session?.auth && !authStore.token)

// const needPermission = true

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['rounded-none', 'shadow-md', 'dark:border-neutral-800']
})

// const getContainerClass = computed(() => {
//   return [
//     'h-full',
//     { 'pl-[260px]': !isMobile.value && !collapsed.value },
//   ]
// })
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayoutContent class="h-full">
        <RouterView v-slot="{ Component, route }">
          <component :is="Component" :key="route.fullPath" />
        </RouterView>
      </NLayoutContent>
    </div>
    <Permission :visible="needPermission" />
  </div>
</template>
