export default function SizeGuidePage() {
  return (
    <section className="guidePage">
      <div className="guideHeader"><p className="eyebrow">FIT GUIDE</p><h1>Chọn size dễ hơn.</h1></div>
      <div className="guideGrid">
        <div className="guideIntro"><p className="eyebrow" style={{color:"#bbb"}}>HOW TO MEASURE</p><h2>Measure once.<br />Wear better.</h2><p>Dùng thước dây đo sát cơ thể nhưng không siết chặt. Với áo, ưu tiên số đo ngực; với quần, ưu tiên eo và mông. Nếu nằm giữa hai size, chọn size lớn hơn cho cảm giác relaxed.</p></div>
        <div>
          <table className="sizeTable"><thead><tr><th>Size</th><th>Ngực (cm)</th><th>Eo (cm)</th><th>Mông (cm)</th></tr></thead><tbody><tr><td>S</td><td>84–90</td><td>68–74</td><td>88–94</td></tr><tr><td>M</td><td>90–96</td><td>74–80</td><td>94–100</td></tr><tr><td>L</td><td>96–102</td><td>80–86</td><td>100–106</td></tr><tr><td>XL</td><td>102–110</td><td>86–94</td><td>106–114</td></tr></tbody></table>
          <div className="guideNotes"><strong>Lưu ý</strong><span>• Mỗi sản phẩm có thể khác nhẹ theo phom regular, relaxed hoặc boxy.</span><span>• Với quần đánh số 28–36, chọn theo vòng eo inch tương ứng.</span><span>• Hỗ trợ đổi size trong 7 ngày kể từ khi nhận hàng, áp dụng với sản phẩm còn nguyên tag.</span></div>
        </div>
      </div>
    </section>
  );
}
