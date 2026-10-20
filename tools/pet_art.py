# Generates the pixel-art PNG pieces for the pet card (run from the project root).
import math, random
from PIL import Image, ImageDraw
random.seed(3)
OUT='assets/ui_comps/'
S=4
def rgb(c): return tuple(int(c[i:i+2],16) for i in (1,3,5))+(255,)
def save(im,name):
    im=im.resize((im.width*S,im.height*S),Image.NEAREST); im.save(OUT+name); print(name,im.size)
def new(w,h): im=Image.new('RGBA',(w,h),(0,0,0,0)); return im,ImageDraw.Draw(im)
def rr(d,x0,y0,x1,y1,r,fill,outline=None): d.rounded_rectangle([x0,y0,x1,y1],radius=r,fill=rgb(fill),outline=rgb(outline) if outline else None)

def box(name,w,h,r,outer,mid,fill,hi=None,shade=None,speck=None,studs=None):
    im,d=new(w,h)
    rr(d,0,0,w-1,h-1,r,outer)
    if mid: rr(d,1,1,w-2,h-2,r,mid)
    rr(d,2 if mid else 1,2 if mid else 1,w-3 if mid else w-2,h-3 if mid else h-2,max(r-1,1),fill)
    o=2 if mid else 1
    if hi:
        for x in range(o+r,w-o-r): im.putpixel((x,o),rgb(hi))
    if shade:
        for x in range(o+r,w-o-r): im.putpixel((x,h-o-1),rgb(shade))
    if speck:
        for _ in range(w*h//30):
            x=random.randint(o+2,w-o-3); y=random.randint(o+2,h-o-3); im.putpixel((x,y),rgb(speck))
    if studs:
        for (x,y) in [(5,5),(w-6,5),(5,h-6),(w-6,h-6)]:
            d.rectangle([x-1,y-1,x,y],fill=rgb(studs))
    save(im,name)

# card: wood-brown border + parchment
box('pc_card.png',40,40,5,'#4a2a10','#8a5a2a','#fbefd2',hi='#fff8e4',shade='#efdcae',speck='#f3e2b6',studs='#e8c98c')
# banner (green ribbon)
box('pc_banner.png',32,16,4,'#1d4a14','#2f6a22','#43802f',hi='#6fa84a',shade='#356a26')
# portrait frame (peach)
box('pc_portrait.png',32,32,5,'#c28a3e','#e2b362','#fcdb9a',hi='#ffe7b4',shade='#f0c882')
# name plate (tan)
box('pc_plate.png',32,22,4,'#b07a3a','#c99555','#f2cf96',hi='#fbe2b4',shade='#e2b87a')
# soft green panel
box('pc_green.png',32,24,4,'#a8bf80','#b9cf92','#e4eecb',hi='#f1f6dc')
# price box
box('pc_price.png',32,22,4,'#b07a3a','#c99555','#fde9b8',hi='#fff3d0')
# buttons
def btn(name,outer,mid,fill,hi,shade):
    box(name,28,20,4,outer,mid,fill,hi=hi,shade=shade)
btn('pc_btn_green.png','#1d4a14','#2f6a22','#43802f','#7db858','#2f6a22')
btn('pc_btn_tan.png','#9a6a2c','#b98745','#e9c58a','#f6dca8','#d4a868')
btn('pc_btn_red.png','#5e1c10','#8a2a1a','#b5452e','#d9694a','#8f3320')

def leaf(d,cx,cy,ang,ln=7,wd=3,fill='#6aa04a',edge='#24541f',light='#8fc65a'):
    pts=[]
    for t in range(21):
        a=t/20*math.pi; pts.append((math.cos(a)*ln/2, math.sin(a)*wd/2))
    for t in range(21):
        a=math.pi+t/20*math.pi; pts.append((math.cos(a)*ln/2, math.sin(a)*wd/2))
    ca,sa=math.cos(ang),math.sin(ang)
    P=[(cx+x*ca-y*sa, cy+x*sa+y*ca) for x,y in pts]
    d.polygon(P,fill=rgb(fill),outline=rgb(edge))
    d.polygon([(cx+x*ca-y*sa, cy+x*sa+y*ca) for x,y in pts[:21]],fill=rgb(light))
    d.line([(cx-ln/2*ca*.8,cy-ln/2*sa*.8),(cx+ln/2*ca*.8,cy+ln/2*sa*.8)],fill=rgb(edge))
def blossom(d,cx,cy,r=4):
    for k in range(5):
        a=k/5*2*math.pi-math.pi/2; x=cx+math.cos(a)*r*.9; y=cy+math.sin(a)*r*.9
        d.ellipse([x-r*.6,y-r*.6,x+r*.6,y+r*.6],fill=rgb('#fffdf0'),outline=rgb('#d8cfb2'))
    d.ellipse([cx-r*.45,cy-r*.45,cx+r*.45,cy+r*.45],fill=rgb('#f2b73c'))

im,d=new(16,16); blossom(d,8,8,4); save(im,'pc_blossom.png')
im,d=new(16,10); leaf(d,8,5,-0.4,14,7); save(im,'pc_leaf.png')
im,d=new(14,14)
d.ellipse([3,7,10,13],fill=rgb('#a86a30'))
for dx,dy in [(0,4),(3,1),(7,1),(10,4)]: d.ellipse([dx,dy,dx+3,dy+3],fill=rgb('#a86a30'))
save(im,'pc_paw.png')
im,d=new(14,20)
d.line([(7,8),(7,19)],fill=rgb('#4f7a2e'),width=1)
leaf(d,4,7,-2.6,9,5,'#7aa25a','#2f5a22','#9cc476'); leaf(d,10,7,-0.5,9,5,'#7aa25a','#2f5a22','#9cc476')
save(im,'pc_sprout.png')
# perk icon: little pot with sprout
im,d=new(20,22)
leaf(d,6,8,-2.5,10,5); leaf(d,14,8,-0.6,10,5); leaf(d,10,4,-1.57,9,5)
d.polygon([(4,12),(16,12),(14,21),(6,21)],fill=rgb('#b8643a'),outline=rgb('#6a3414'))
d.rectangle([3,11,17,13],fill=rgb('#cf7a44'),outline=rgb('#6a3414'))
save(im,'pc_perk.png')
# zzz tuck tile & room thumb frames
box('pc_thumb.png',28,20,3,'#b9cf92','#d6e4b4','#f4f8e4')
box('pc_thumb_on.png',28,20,3,'#1d4a14','#3f8a35','#e6f2cc')
