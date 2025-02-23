<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { UploadFileInfo } from 'naive-ui'
import { NButton, NInput, NUpload, useDialog, useMessage } from 'naive-ui'
import html2canvas from 'html2canvas'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore } from '@/store'
import { fetchChatAPIProcess, fetchModelResp } from '@/api'
import { t } from '@/locales'
import { readFile } from '@/utils/functions/index'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true'

const route = useRoute()
const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()

const { isMobile } = useBasicLayout()
const { addChat, updateChat, updateChatSome } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()

const { uuid } = route.params as { uuid: string }

const dataSources = computed(() => chatStore.getChatByUuid(+uuid))

const prompt = ref<string>('')
const image = ref<UploadFileInfo[]>([])
const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)

// 未知原因刷新页面，loading 状态不会重置，手动重置
dataSources.value.forEach((item, index) => {
  if (item.loading)
    updateChatSome(+uuid, index, { loading: false })
})

function handleSubmit() {
  onPost()
}

async function onPost() {
  if (!prompt.value || !image.value.length) {
    dialog.warning({
      title: t('chat.lackInput'),
      content: t('chat.needInputAndImage'),
      positiveText: t('common.yes'),
    })
    return
  }

  if (!image.value[0].file) {
    dialog.error({
      title: '错误',
      content: '图片解析错误',
      positiveText: t('common.yes'),
    })
    return
  }

  const imageBase64 = await readFile(image.value[0].file)

  const message = {
    prompt: prompt.value,
    image: imageBase64,
  }

  addChat(
    +uuid,
    {
      dateTime: new Date().toLocaleString(),
      text: message.prompt,
      inversion: true,
      image: imageBase64,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message.prompt, options: null },
    },
  )
  scrollToBottom()

  loading.value = true
  prompt.value = ''
  image.value = []

  addChat(
    +uuid,
    {
      dateTime: new Date().toLocaleString(),
      text: '',
      inversion: false,
      error: false,
      conversationOptions: null,
      requestOptions: { prompt: message.prompt, options: {} },
    },
  )
  scrollToBottom()

  try {
    const modelResp = await fetchModelResp<{ result?: string }>(message)
    if (typeof modelResp.data.result !== 'string')
      throw new Error('interface error, 请查看返回值')

    updateChat(
      +uuid,
      dataSources.value.length - 1,
      {
        dateTime: new Date().toLocaleString(),
        text: modelResp.data.result,
        inversion: false,
        error: false,
        loading: false,
        requestOptions: { prompt: message.prompt, options: {} },
      },
    )
  }
  catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(
      +uuid,
      dataSources.value.length - 1,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message.prompt, options: {} },
      },
    )
    scrollToBottomIfAtBottom()
  }
  finally {
    loading.value = false
  }
}

// async function onConversation() {
//   let message = prompt.value

//   if (loading.value)
//     return

//   if (!message || message.trim() === '')
//     return

//   controller = new AbortController()

//   addChat(
//     +uuid,
//     {
//       dateTime: new Date().toLocaleString(),
//       text: message,
//       inversion: true,
//       error: false,
//       conversationOptions: null,
//       requestOptions: { prompt: message, options: null },
//     },
//   )
//   scrollToBottom()

//   loading.value = true
//   prompt.value = ''

//   const options: Chat.ConversationRequest = {}

//   addChat(
//     +uuid,
//     {
//       dateTime: new Date().toLocaleString(),
//       text: '',
//       loading: true,
//       inversion: false,
//       error: false,
//       conversationOptions: null,
//       requestOptions: { prompt: message, options: {} },
//     },
//   )
//   scrollToBottom()

//   try {
//     let lastText = ''
//     const fetchChatAPIOnce = async () => {
//       await fetchChatAPIProcess<Chat.ConversationResponse>({
//         prompt: message,
//         options,
//         signal: controller.signal,
//         onDownloadProgress: ({ event }) => {
//           const xhr = event.target
//           const { responseText } = xhr
//           // Always process the final line
//           const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
//           let chunk = responseText
//           if (lastIndex !== -1)
//             chunk = responseText.substring(lastIndex)
//           try {
//             const data = JSON.parse(chunk)
//             updateChat(
//               +uuid,
//               dataSources.value.length - 1,
//               {
//                 dateTime: new Date().toLocaleString(),
//                 text: lastText + (data.text ?? ''),
//                 inversion: false,
//                 error: false,
//                 loading: true,
//                 conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
//                 requestOptions: { prompt: message, options: { ...options } },
//               },
//             )

//             if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
//               options.parentMessageId = data.id
//               lastText = data.text
//               message = ''
//               return fetchChatAPIOnce()
//             }

//             scrollToBottomIfAtBottom()
//           }
//           catch (error) {
//             //
//           }
//         },
//       })
//       updateChatSome(+uuid, dataSources.value.length - 1, { loading: false })
//     }

//     await fetchChatAPIOnce()
//   }
//   catch (error: any) {
//     const errorMessage = error?.message ?? t('common.wrong')

//     if (error.message === 'canceled') {
//       updateChatSome(
//         +uuid,
//         dataSources.value.length - 1,
//         {
//           loading: false,
//         },
//       )
//       scrollToBottomIfAtBottom()
//       return
//     }

//     const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

//     if (currentChat?.text && currentChat.text !== '') {
//       updateChatSome(
//         +uuid,
//         dataSources.value.length - 1,
//         {
//           text: `${currentChat.text}\n[${errorMessage}]`,
//           error: false,
//           loading: false,
//         },
//       )
//       return
//     }

//     updateChat(
//       +uuid,
//       dataSources.value.length - 1,
//       {
//         dateTime: new Date().toLocaleString(),
//         text: errorMessage,
//         inversion: false,
//         error: true,
//         loading: false,
//         conversationOptions: null,
//         requestOptions: { prompt: message, options: { ...options } },
//       },
//     )
//     scrollToBottomIfAtBottom()
//   }
//   finally {
//     loading.value = false
//   }
// }

async function onRegenerate(index: number) {
  if (loading.value)
    return

  controller = new AbortController()

  const { requestOptions } = dataSources.value[index]

  let message = requestOptions?.prompt ?? ''

  let options: Chat.ConversationRequest = {}

  if (requestOptions.options)
    options = { ...requestOptions.options }

  loading.value = true

  updateChat(
    +uuid,
    index,
    {
      dateTime: new Date().toLocaleString(),
      text: '',
      inversion: false,
      error: false,
      loading: true,
      conversationOptions: null,
      requestOptions: { prompt: message, options: { ...options } },
    },
  )

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<Chat.ConversationResponse>({
        prompt: message,
        options,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          // Always process the final line
          const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
          let chunk = responseText
          if (lastIndex !== -1)
            chunk = responseText.substring(lastIndex)
          try {
            const data = JSON.parse(chunk)
            updateChat(
              +uuid,
              index,
              {
                dateTime: new Date().toLocaleString(),
                text: lastText + (data.text ?? ''),
                inversion: false,
                error: false,
                loading: true,
                conversationOptions: { conversationId: data.conversationId, parentMessageId: data.id },
                requestOptions: { prompt: message, options: { ...options } },
              },
            )

            if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
              options.parentMessageId = data.id
              lastText = data.text
              message = ''
              return fetchChatAPIOnce()
            }
          }
          catch (error) {
            //
          }
        },
      })
      updateChatSome(+uuid, index, { loading: false })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      updateChatSome(
        +uuid,
        index,
        {
          loading: false,
        },
      )
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    updateChat(
      +uuid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        inversion: false,
        error: true,
        loading: false,
        conversationOptions: null,
        requestOptions: { prompt: message, options: { ...options } },
      },
    )
  }
  finally {
    loading.value = false
  }
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const canvas = await html2canvas(ele as HTMLDivElement, {
          useCORS: true,
        })
        const imgUrl = canvas.toDataURL('image/png')
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')

        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      }
      catch (error: any) {
        ms.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatByUuid(+uuid, index)
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatByUuid(+uuid)
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  if (loading.value) {
    controller.abort()
    loading.value = false
  }
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

onMounted(() => {
  scrollToBottom()
  if (inputRef.value && !isMobile.value)
    inputRef.value?.focus()
})

onUnmounted(() => {
  if (loading.value)
    controller.abort()
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <main class="flex-1 overflow-hidden">
      <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
        <div
          id="image-wrapper"
          class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
        >
          <template v-if="!dataSources.length">
            <div class="flex items-center justify-center mt-4 text-center text-neutral-300">
              <SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
              <span>你好</span>
            </div>
          </template>
          <template v-else>
            <div class="p-2">
              <Message
                v-for="(item, index) of dataSources"
                :key="index"
                :date-time="item.dateTime"
                :text="item.text"
                :inversion="item.inversion"
                :error="item.error"
                :loading="item.loading"
                :image="item.image"
                @regenerate="onRegenerate(index)"
                @delete="handleDelete(index)"
              />
              <div class="sticky bottom-0 left-0 flex justify-center">
                <NButton v-if="loading" type="warning" @click="handleStop">
                  <template #icon>
                    <SvgIcon icon="ri:stop-circle-line" />
                  </template>
                  {{ t('common.stopResponding') }}
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <HoverButton v-if="!isMobile" @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line" />
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="handleExport">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:download-2-line" />
            </span>
          </HoverButton>
          <NUpload v-model:file-list="image" class="flex-1 flex items-center" accept=".jpg,.jpeg,.png" list-type="image">
            <NButton>上传图片</NButton>
          </NUpload>
          <NInput
            ref="inputRef"
            v-model:value="prompt"
            type="textarea"
            :placeholder="placeholder"
            :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
            @keypress="handleEnter"
          />
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill" />
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>
</template>
