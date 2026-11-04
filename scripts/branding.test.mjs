import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('Vitis assets use the approved palette and transparent canvas', () => {
  for (const variant of ['icon', 'wordmark']) {
    const svg = source(`public/images/vitis-${variant}.svg`)
    assert.match(svg, /<svg[^>]*fill="none"/)
    assert.match(svg, /#A00060/)
    assert.match(svg, /#8F00FF/)
    assert.doesNotMatch(svg, /<rect[^>]*width="920"|<image|<script/)
  }
  const wordmark = source('public/images/vitis-wordmark.svg')
  assert.match(wordmark, /fill="#000000">VITIS<\/text>/)
  assert.match(wordmark, /fill="#000000">AI Workflow Automation<\/text>/)
})

test('Login, register and header use the transparent wordmark', () => {
  for (const file of ['src/pages/Login.tsx', 'src/pages/Register.tsx', 'src/modules/core-shell/components/Topbar.tsx']) {
    const text = source(file)
    const image = text.match(/<img[^>]*src="\/images\/vitis-wordmark\.svg"[^>]*>/)?.[0]
    assert.ok(image, file)
    assert.match(image, /alt="Vitis — AI Workflow Automation"/)
    assert.doesNotMatch(image, /bg-white|bg-slate/)
    assert.doesNotMatch(text, /\/images\/logo(?:-white)?\.png/)
  }
})

test('Favicon uses the compact VT monogram', () => {
  assert.match(source('index.html'), /href="\/images\/vitis-icon\.svg"/)
  assert.doesNotMatch(source('index.html'), /\/vite\.svg/)
})
