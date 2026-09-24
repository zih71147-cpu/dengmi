/** 依据得分返回一句中秋祝福语（结算页与海报共用） */
export function blessingFor(score, total) {
  const ratio = total > 0 ? score / total : 0
  if (ratio >= 1) return '灯谜全中，才思敏捷！愿你月圆人圆事事团圆。'
  if (ratio >= 0.6) return '花好月圆，答题有方！愿你事事圆满，好运连连。'
  if (ratio > 0) return '明月千里寄相思，再接再厉更精彩！中秋佳节，愿你平安喜乐。'
  return '月色正好，重在参与！愿明月捎去祝福，中秋快乐，阖家安康。'
}
