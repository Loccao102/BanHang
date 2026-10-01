export default function SizeGuidePage() {
  return (
    <section className="guidePage">
      <div className="guideHeader"><p className="eyebrow">LSOUL FIT GUIDE</p><h1>Đúng size.<br />Đúng silhouette.</h1></div>
      <div className="guideGrid">
        <div className="guideIntro"><p className="eyebrow" style={{color:"#bbb"}}>HOW TO MEASURE</p><h2>Fit is part<br />of the design.</h2><p>Các thiết kế LSOUL thường nhấn vào eo và đường cong. Dùng thước dây đo sát cơ thể nhưng không siết chặt. Với corset và bodycon, ưu tiên vòng ngực – eo – mông; nếu nằm giữa hai size và muốn dễ cử động hơn, chọn size lớn hơn.</p></div>
        <div>
          <table className="sizeTable"><thead><tr><th>Size</th><th>Ngực (cm)</th><th>Eo (cm)</th><th>Mông (cm)</th></tr></thead><tbody><tr><td>XS</td><td>78–82</td><td>60–64</td><td>84–88</td></tr><tr><td>S</td><td>82–86</td><td>64–68</td><td>88–92</td></tr><tr><td>M</td><td>86–90</td><td>68–72</td><td>92–96</td></tr><tr><td>L</td><td>90–96</td><td>72–78</td><td>96–102</td></tr><tr><td>XL</td><td>96–102</td><td>78–84</td><td>102–108</td></tr></tbody></table>
          <div className="guideNotes"><strong>Lưu ý</strong><span>• Corset, bodysuit và bodycon dress có độ ôm cao hơn sản phẩm thông thường.</span><span>• Jeans đánh số 24–30 nên chọn theo số đo vòng eo và phần hông.</span><span>• Tồn kho hiển thị riêng theo từng size trên trang sản phẩm.</span><span>• Hỗ trợ đổi size trong 7 ngày với sản phẩm còn nguyên tag và chưa qua sử dụng.</span></div>
        </div>
      </div>
    </section>
  );
}
