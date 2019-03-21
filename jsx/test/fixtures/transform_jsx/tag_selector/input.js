function view() {
<>
    <div></div>
    <div id="some-id"></div>
    <div class="some-class"></div>
    <div class="some-class other-class"></div>
    <div class="some-class" class="other-class" />
    <div id="some-id" class="some-class"></div>
    <div id="some-id" class="some-class other-class"></div>
    <div id={"some-id"} />
    <div class={"some-class other-class"} />
</>
}
