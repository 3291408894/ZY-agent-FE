<script setup lang="ts">
/** A4 纸试卷预览 */

import { computed } from 'vue'
import type { IExamPaperContent } from '@/types'
import MathRenderer from '@/components/common/MathRenderer.vue'

const props = defineProps<{
  content: IExamPaperContent
}>()

function questionTypeLabel(type: string) {
  const map: Record<string, string> = {
    choice: '选择题',
    fill: '填空题',
    fill_blank: '填空题',
    fill_in: '填空题',
    short_answer: '简答题',
    calculation: '计算题',
    comprehensive: '综合题',
    analysis: '分析题',
  }
  return map[type] || type
}
</script>

<template>
  <div class="exam-preview">
    <!-- A4 纸模拟 -->
    <div class="exam-preview__paper" id="exam-paper-print">
      <!-- 密封线 -->
      <div class="exam-preview__seal">
        <div class="exam-preview__seal-line">
          <span>学</span><span>校</span>：______________ &nbsp;
          <span>班</span><span>级</span>：______________<br/>
          <span>姓</span><span>名</span>：______________ &nbsp;
          <span>学</span><span>号</span>：______________
        </div>
        <div class="exam-preview__seal-divider">············ 密封线内不要答题 ············</div>
      </div>

      <!-- 试卷头部 -->
      <div class="exam-preview__header">
        <h1>{{ content.header.title }}</h1>
        <div class="exam-preview__meta">
          <span>学科：{{ content.header.subject }}</span>
          <span>年级：{{ content.header.grade }}</span>
          <span>类型：{{ content.header.exam_type }}</span>
          <span>总分：{{ content.header.total_score }}分</span>
          <span>时间：{{ content.header.duration_minutes }}分钟</span>
        </div>
      </div>

      <!-- 考生须知 -->
      <div v-if="content.header.instructions" class="exam-preview__instructions">
        <strong>考生须知：</strong>{{ content.header.instructions }}
      </div>

      <!-- 各答题部分 -->
      <div
        v-for="(section, si) in content.sections"
        :key="si"
        class="exam-preview__section"
      >
        <h3>{{ section.title }}</h3>
        <p v-if="section.instructions" class="exam-preview__section-instructions">
          {{ section.instructions }}
        </p>

        <div
          v-for="question in section.questions"
          :key="question.number"
          class="exam-preview__question"
        >
          <div class="exam-preview__question-stem">
            <strong>{{ question.number }}.</strong> <MathRenderer :text="question.stem" />
            <span class="exam-preview__question-score">（{{ question.score }}分）</span>
          </div>

          <!-- 选择题选项 -->
          <div
            v-if="question.options && question.question_type === 'choice'"
            class="exam-preview__options"
          >
            <span
              v-for="(opt, oi) in question.options"
              :key="oi"
              class="exam-preview__option"
            >
              <MathRenderer :text="opt" />
            </span>
          </div>

          <!-- 填空题留白 -->
          <div v-else-if="question.question_type === 'fill' || question.question_type === 'fill_blank' || question.question_type === 'fill_in'"
               class="exam-preview__blank">
            答：_________________
          </div>

          <!-- 简答/计算/综合题留白 -->
          <div
            v-else
            class="exam-preview__answer-space"
          >
            解：
            <div class="exam-preview__answer-lines">
              <div v-for="n in 6" :key="n" class="exam-preview__answer-line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 参考答案（分页） -->
      <div class="exam-preview__page-break"></div>
      <div class="exam-preview__answers">
        <h2>参考答案与评分标准</h2>
        <div
          v-for="(section, si) in content.sections"
          :key="'a' + si"
          class="exam-preview__answer-section"
        >
          <h4>{{ section.title }}</h4>
          <div
            v-for="question in section.questions"
            :key="'a' + question.number"
            class="exam-preview__answer-item"
          >
            <p><strong>{{ question.number }}.</strong> 答案：<MathRenderer :text="question.answer" />（{{ question.score }}分）</p>
            <p v-if="question.analysis" class="exam-preview__analysis">
              解析：<MathRenderer :text="question.analysis" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.exam-preview {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #e8e8e8;
  min-height: 100vh;

  &__paper {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 18mm 25mm 25mm;
    background: #fff;
    box-shadow: 0 2px 16px rgba(0,0,0,0.15);
    font-family: 'SimSun', 'STSong', 'Songti SC', serif;
    font-size: 14px;
    line-height: 1.8;
    color: #333;

    @media print {
      box-shadow: none;
      padding: 0;
      width: auto;
      page-break-after: always;
    }
  }

  &__seal {
    margin-bottom: 16px;
    font-size: 12px;
    color: #999;
    padding: 12px;
    border: 1px dashed #ccc;
    border-radius: 4px;

    &-line span { display: inline-block; }
    &-divider {
      text-align: center;
      color: #ccc;
      margin-top: 8px;
    }
  }

  &__header {
    text-align: center;
    margin-bottom: 20px;
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 10px;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    font-size: 14px;
    color: #555;
  }

  &__instructions {
    font-size: 13px;
    color: #666;
    padding: 10px 14px;
    background: #f9f9f9;
    border-radius: 4px;
    margin-bottom: 20px;
    border-left: 3px solid #5B9BD5;
  }

  &__section {
    margin-bottom: 24px;
    h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    &-instructions {
      font-size: 13px;
      color: #888;
      font-style: italic;
      margin-bottom: 12px;
    }
  }

  &__question {
    margin-bottom: 14px;
    &-stem { font-size: 14px; margin-bottom: 6px; }
    &-score { color: #888; font-size: 12px; }
  }

  &__options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 24px;
    margin-left: 24px;
  }

  &__option {
    font-size: 14px;
  }

  &__blank {
    margin-left: 24px;
    color: #ccc;
    font-size: 13px;
  }

  &__answer-space {
    margin-left: 24px;
  }

  &__answer-lines {
    margin-top: 4px;
  }

  &__answer-line {
    border-bottom: 1px dotted #ddd;
    height: 22px;
  }

  &__page-break {
    page-break-before: always;
    border-top: 1px dashed #ccc;
    margin: 24px 0;
    &::before { content: '—— 以下为参考答案 ——'; display: block; text-align: center; color: #999; font-size: 12px; padding: 8px 0; }
  }

  &__answers {
    h2 { text-align: center; font-size: 18px; margin-bottom: 16px; }
  }

  &__answer-section {
    margin-bottom: 16px;
    h4 { font-size: 15px; color: #5B9BD5; margin-bottom: 8px; }
  }

  &__answer-item {
    margin-bottom: 8px;
    p { font-size: 13px; }
  }

  &__analysis {
    color: #888;
    font-size: 12px;
    font-style: italic;
    margin-left: 20px;
  }
}
</style>
