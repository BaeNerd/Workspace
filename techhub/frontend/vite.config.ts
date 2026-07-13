import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// share 모드(=vite build --mode share)에서만 JS·CSS를 단일 HTML로 인라인한다.
// 그 외(개발 서버·본 빌드)는 기존 설정 그대로.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'share' ? [viteSingleFile()] : [])],
}))
